import { NextRequest, NextResponse } from "next/server"
import { Client } from "@upstash/qstash"
import { hasValidBearerSecret } from "@/lib/request-auth"

// 授業10分前リマインダー用の QStash Schedule を作成する管理用エンドポイント（一度だけ実行）。
// Vercel Hobby は Cron が「最大2個・1日1回」までのため、5分毎のポーリングは
// QStash Schedule に任せる。デプロイ後に一度だけ叩く:
//   curl -X POST https://<your-domain>/api/qstash/setup-reminder-schedule \
//     -H "Authorization: Bearer <CRON_SECRET>"
// 同一 destination の既存スケジュールは削除してから作り直すので、再実行しても重複しない。
// Vercel Pro に上げて vercel.json に cron を足す場合は、このスケジュールは不要（削除推奨）。

export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!hasValidBearerSecret(req, cronSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!process.env.QSTASH_TOKEN) {
    return NextResponse.json({ error: "QSTASH_TOKEN is not set" }, { status: 500 })
  }
  const baseUrl = (process.env.NEXTAUTH_URL ?? "").replace(/\/$/, "")
  if (!baseUrl) {
    return NextResponse.json({ error: "NEXTAUTH_URL is not set" }, { status: 500 })
  }

  const destination = `${baseUrl}/api/cron/lesson-reminder`
  const client = new Client({ token: process.env.QSTASH_TOKEN })

  // 既存の同一 destination スケジュールを削除して重複を防ぐ
  const existing = await client.schedules.list()
  const dupes = existing.filter((s) => s.destination === destination)
  for (const s of dupes) {
    await client.schedules.delete(s.scheduleId)
  }

  const { scheduleId } = await client.schedules.create({
    destination,
    cron: "*/5 * * * *",
    // destination 側の Bearer 認証を満たすヘッダを転送する
    headers: { Authorization: `Bearer ${cronSecret}` },
  })

  return NextResponse.json({ ok: true, scheduleId, destination, removedDuplicates: dupes.length })
}
