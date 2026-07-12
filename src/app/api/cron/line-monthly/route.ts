import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { calcFeeBreakdown } from "@/lib/billing"
import { formatCurrency } from "@/lib/format"
import { sendLineMessage } from "@/lib/line"

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
  const monthLabel = `${prevMonth.getFullYear()}年${prevMonth.getMonth() + 1}月`

  // --- 先生向けレポート ---
  const teachers = await db.user.findMany({
    where: { role: "teacher", lineUserId: { not: null } },
    include: {
      students: {
        include: {
          user: { select: { name: true } },
          lessons: {
            where: { date: { gte: prevMonth, lte: prevMonthEnd } },
            select: { durationMin: true, hourlyRate: true, travelExpense: true, type: true },
          },
          homeworks: {
            where: {
              status: "approved",
              reviewedAt: { gte: prevMonth, lte: prevMonthEnd },
            },
            select: { id: true },
          },
        },
      },
    },
  })

  // 全生徒分の当月宿題数を一括集計（先生×生徒のネストしたN+1回避）
  const allStudentIds = teachers.flatMap((t) => t.students.map((s) => s.id))
  const homeworkCounts = await db.homework.groupBy({
    by: ["studentId"],
    where: {
      studentId: { in: allStudentIds },
      createdAt: { gte: prevMonth, lte: prevMonthEnd },
    },
    _count: { _all: true },
  })
  const homeworkCountByStudent = new Map(
    homeworkCounts.map((c) => [c.studentId, c._count._all])
  )

  for (const teacher of teachers) {
    if (!teacher.lineUserId || teacher.students.length === 0) continue

    const lines: string[] = [`📊 ${monthLabel}の授業レポート`]
    let totalAmount = 0

    for (const student of teacher.students) {
      const lessons = student.lessons
      if (lessons.length === 0) continue

      const totalMin = lessons.reduce((s, l) => s + (l.durationMin ?? 0), 0)
      const amount = lessons.reduce((s, l) => s + calcFeeBreakdown(l).total, 0)
      totalAmount += amount

      const approvedCount = student.homeworks.length
      const totalHomework = homeworkCountByStudent.get(student.id) ?? 0
      const rate = totalHomework > 0 ? Math.round((approvedCount / totalHomework) * 100) : 0

      lines.push(`\n▶ ${student.user.name}`)
      lines.push(`　授業: ${lessons.length}回 / ${totalMin}分`)
      lines.push(`　請求: ${formatCurrency(amount)}`)
      if (totalHomework > 0) lines.push(`　宿題承認率: ${rate}%`)
    }

    lines.push(`\n─────────`)
    lines.push(`合計請求額: ${formatCurrency(totalAmount)}`)

    await sendLineMessage(teacher.lineUserId, lines.join("\n"))
  }

  return NextResponse.json({ ok: true })
}
