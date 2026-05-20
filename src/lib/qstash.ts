import { Client } from "@upstash/qstash"

function getClient() {
  return new Client({ token: process.env.QSTASH_TOKEN! })
}

export async function scheduleReminderMessage(lessonId: string, lessonDate: Date): Promise<string | null> {
  const reminderAt = new Date(lessonDate.getTime() - 10 * 60 * 1000)
  const delaySeconds = Math.round((reminderAt.getTime() - Date.now()) / 1000)

  if (delaySeconds <= 0) return null

  const client = getClient()
  const result = await client.publishJSON({
    url: `${process.env.NEXTAUTH_URL}/api/webhooks/lesson-reminder`,
    delay: delaySeconds,
    body: { lessonId },
  })

  return result.messageId
}

export async function cancelReminderMessage(messageId: string): Promise<void> {
  const client = getClient()
  try {
    await client.messages.delete(messageId)
  } catch {
    // すでに配信済みまたは存在しないメッセージは無視
  }
}
