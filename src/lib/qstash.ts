import { Client } from "@upstash/qstash"

function getClient() {
  if (!process.env.QSTASH_TOKEN) {
    throw new Error("[QStash] QSTASH_TOKEN is not set")
  }
  return new Client({ token: process.env.QSTASH_TOKEN })
}

export async function scheduleReminderMessage(lessonId: string, lessonDate: Date): Promise<string | null> {
  const reminderAt = new Date(lessonDate.getTime() - 10 * 60 * 1000)
  const delaySeconds = Math.round((reminderAt.getTime() - Date.now()) / 1000)

  if (delaySeconds <= 0) {
    console.log(`[QStash] skip: lesson ${lessonId} is less than 10 min away`)
    return null
  }

  // 末尾スラッシュを除去して二重スラッシュを防ぐ
  const baseUrl = (process.env.NEXTAUTH_URL ?? "").replace(/\/$/, "")
  const url = `${baseUrl}/api/webhooks/lesson-reminder`

  console.log(`[QStash] scheduling reminder lessonId=${lessonId} delay=${delaySeconds}s url=${url}`)

  const client = getClient()
  const result = await client.publishJSON({
    url,
    delay: delaySeconds,
    body: { lessonId },
  })

  console.log(`[QStash] scheduled messageId=${result.messageId}`)
  return result.messageId
}

export async function cancelReminderMessage(messageId: string): Promise<void> {
  try {
    const client = getClient()
    await client.messages.delete(messageId)
  } catch (err) {
    console.error("[QStash] cancel failed:", err)
  }
}
