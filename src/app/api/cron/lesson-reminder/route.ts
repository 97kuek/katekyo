import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendLineMessage } from "@/lib/line"
import { hasValidCronSecret } from "@/lib/request-auth"

/**
 * オンライン授業の Meet リンクを開始10分前に LINE 配信するセーフティネット。
 *
 * QStash の per-lesson スケジュール（lib/qstash.ts）は一度きりの配信で、失敗すると
 * 復旧しないため不安定だった。このエンドポイントを数分おきに叩き、「これから10分前後に
 * 始まるオンライン授業」をスキャンして確実に配信する。`reminderSentAt` で冪等化し、
 * QStash 経路と二重送信しない。
 *
 * トリガーは `Authorization: Bearer CRON_SECRET` で認証する想定:
 * - Vercel Pro なら Vercel Cron（GET）
 * - Vercel Hobby なら QStash Schedule（POST・`Upstash-Forward-Authorization` でヘッダ転送）
 * どちらでも動くよう GET / POST 両方を受ける。
 */
async function handle(req: NextRequest) {
  if (!hasValidCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  // 「10分前」を狙うが、cron 間隔のズレを吸収するため now+2分〜now+13分の開始を対象にする
  const windowStart = new Date(now.getTime() + 2 * 60 * 1000)
  const windowEnd = new Date(now.getTime() + 13 * 60 * 1000)

  const lessons = await db.lesson.findMany({
    where: {
      type: "online",
      completedAt: null,
      reminderSentAt: null,
      date: { gte: windowStart, lte: windowEnd },
    },
    include: {
      teacher: { select: { meetLink: true, lineUserId: true } },
      student: { include: { user: { select: { lineUserId: true, name: true } } } },
    },
  })

  let sent = 0
  for (const lesson of lessons) {
    const meetLink = lesson.teacher.meetLink
    if (!meetLink) continue

    const claimedAt = new Date()
    const claimed = await db.lesson.updateMany({
      where: { id: lesson.id, reminderSentAt: null },
      data: { reminderSentAt: claimedAt },
    })
    if (claimed.count !== 1) continue

    const studentName = lesson.student.user.name
    const sends: Promise<void>[] = []

    if (lesson.student.user.lineUserId) {
      sends.push(sendLineMessage(
        lesson.student.user.lineUserId,
        `📅 もうすぐ授業が始まります\n\n10分後に授業が始まります。\n以下のリンクからGoogle Meetに参加してください。\n\n${meetLink}`
      ))
    }
    if (lesson.teacher.lineUserId) {
      sends.push(sendLineMessage(
        lesson.teacher.lineUserId,
        `📅 まもなく授業があります\n\n${studentName}さんとの授業が10分後に始まります。\n\n${meetLink}`
      ))
    }

    // 送信先が無くても、既読扱いにして次回スキャン対象から外す
    if (sends.length > 0) {
      await Promise.all(sends)
      sent++
    }
  }

  return NextResponse.json({ ok: true, scanned: lessons.length, sent })
}

export const GET = handle
export const POST = handle
