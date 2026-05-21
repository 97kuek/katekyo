import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendLineMessage } from "@/lib/line"

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)

  // lineUserId が設定された全生徒を取得
  const students = await db.student.findMany({
    where: { user: { lineUserId: { not: null } } },
    include: { user: { select: { lineUserId: true, name: true } } },
  })

  let sent = 0
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

    const baseUrl = process.env.NEXTAUTH_URL ?? ""
    const lines: string[] = ["📚 宿題リマインダー"]

    if (todayDue.length > 0) {
      lines.push("\n【今日が期限】")
      todayDue.forEach((h) => lines.push(`・${h.title}`))
    }

    if (overdue.length > 0) {
      lines.push("\n【期限切れ】")
      overdue.forEach((h) => {
        const d = h.dueDate.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })
        lines.push(`・${h.title}（${d}が期限でした）`)
      })
    }

    lines.push(`\n${baseUrl}/homework`)

    await sendLineMessage(lineUserId, lines.join("\n"))
    sent++
  }

  return NextResponse.json({ ok: true, sent })
}
