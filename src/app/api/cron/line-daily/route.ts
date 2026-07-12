import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { PENDING_STATUSES } from "@/lib/homework-status"
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

  // 全生徒分の対象宿題を一括取得し、生徒ごとにグルーピング（N+1回避）
  const pendingHomeworks = await db.homework.findMany({
    where: {
      studentId: { in: students.map((s) => s.id) },
      status: { in: PENDING_STATUSES },
      dueDate: { lte: todayEnd },
    },
    select: { studentId: true, title: true, dueDate: true },
    orderBy: { dueDate: "asc" },
  })
  const homeworksByStudent = new Map<string, typeof pendingHomeworks>()
  for (const hw of pendingHomeworks) {
    const list = homeworksByStudent.get(hw.studentId) ?? []
    list.push(hw)
    homeworksByStudent.set(hw.studentId, list)
  }

  let sentStudent = 0
  for (const student of students) {
    const lineUserId = student.user.lineUserId!
    const homeworks = homeworksByStudent.get(student.id) ?? []
    const todayDue = homeworks.filter((h) => h.dueDate >= todayStart)
    const overdue = homeworks.filter((h) => h.dueDate < todayStart)

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

    // 全先生分の未完了授業を一括取得し、先生ごとにグルーピング（N+1回避）
    const uncompletedLessons = await db.lesson.findMany({
      where: {
        teacherId: { in: teachers.map((t) => t.id) },
        completedAt: null,
        date: { lt: oneDayAgo },
      },
      include: { student: { include: { user: { select: { name: true } } } } },
      orderBy: { date: "asc" },
    })
    const lessonsByTeacher = new Map<string, typeof uncompletedLessons>()
    for (const lesson of uncompletedLessons) {
      const list = lessonsByTeacher.get(lesson.teacherId) ?? []
      if (list.length < 10) list.push(lesson)
      lessonsByTeacher.set(lesson.teacherId, list)
    }

    for (const teacher of teachers) {
      const uncompleted = lessonsByTeacher.get(teacher.id) ?? []
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
