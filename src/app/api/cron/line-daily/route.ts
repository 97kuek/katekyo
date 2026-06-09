import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendLineMessage } from "@/lib/line"

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const baseUrl = process.env.NEXTAUTH_URL ?? ""

  // ── 生徒: 宿題リマインダー ────────────────────────────────────────────────
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)

  const students = await db.student.findMany({
    where: { user: { lineUserId: { not: null } } },
    include: { user: { select: { lineUserId: true, name: true } } },
  })

  let sentStudent = 0
  for (const student of students) {
    const lineUserId = student.user.lineUserId!

    const [todayDue, overdue] = await Promise.all([
      db.homework.findMany({
        where: {
          studentId: student.id,
          status: { in: ["assigned", "rejected"] },
          dueDate: { gte: todayStart, lte: todayEnd },
        },
        select: { title: true },
      }),
      db.homework.findMany({
        where: {
          studentId: student.id,
          status: { in: ["assigned", "rejected"] },
          dueDate: { lt: todayStart },
        },
        select: { title: true, dueDate: true },
      }),
    ])

    if (todayDue.length === 0 && overdue.length === 0) continue

    const lines: string[] = ["📚 宿題リマインダー"]

    if (todayDue.length > 0) {
      lines.push("\n【今日が期限】")
      todayDue.forEach((h) => lines.push(`・${h.title}`))
    }

    if (overdue.length > 0) {
      lines.push("\n【期限切れ】")
      overdue.forEach((h) => {
        const d = h.dueDate.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric", timeZone: "Asia/Tokyo" })
        lines.push(`・${h.title}（${d}が期限でした）`)
      })
    }

    lines.push(`\n${baseUrl}/homework`)

    await sendLineMessage(lineUserId, lines.join("\n"))
    sentStudent++
  }

  // ── 先生: 未完了授業リマインダー（月曜 8:00 JST のみ）──────────────────────
  // Cron は毎日 23:00 UTC = 翌朝 8:00 JST に動く。
  // 月曜 8:00 JST = 日曜 23:00 UTC なので UTC の曜日が 0（日曜）のときが月曜朝。
  let sentTeacher = 0
  const isMonday = now.getUTCDay() === 0

  if (isMonday) {
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const teachers = await db.user.findMany({
      where: { role: "teacher", lineUserId: { not: null } },
      select: { id: true, lineUserId: true },
    })

    for (const teacher of teachers) {
      const uncompleted = await db.lesson.findMany({
        where: {
          teacherId: teacher.id,
          completedAt: null,
          date: { lt: oneDayAgo },
        },
        include: { student: { include: { user: { select: { name: true } } } } },
        orderBy: { date: "asc" },
        take: 10,
      })

      if (uncompleted.length === 0) continue

      const lines = ["📋 未完了の授業があります\n"]
      uncompleted.forEach((l) => {
        const d = l.date.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric", timeZone: "Asia/Tokyo" })
        lines.push(`・${d} ${l.student.user.name}さん`)
      })
      lines.push(`\n完了済みにすると請求に反映されます。\n${baseUrl}/calendar`)

      await sendLineMessage(teacher.lineUserId!, lines.join("\n"))
      sentTeacher++
    }
  }

  return NextResponse.json({ ok: true, sentStudent, sentTeacher })
}
