type LineMessage =
  | { type: "text"; text: string }
  | { type: "image"; originalContentUrl: string; previewImageUrl: string }

async function pushLineMessages(lineUserId: string, messages: LineMessage[]): Promise<void> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  if (!token) return

  const res = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ to: lineUserId, messages }),
  }).catch((err: unknown) => {
    console.error("[LINE] fetch failed:", err)
    return null
  })

  if (res && !res.ok) {
    const body = await res.text().catch(() => "")
    console.error(`[LINE] API error ${res.status}:`, body)
  }
}

export async function sendLineMessage(lineUserId: string, text: string): Promise<void> {
  await pushLineMessages(lineUserId, [{ type: "text", text }])
}

export async function linkRichMenuToUser(lineUserId: string, richMenuId: string): Promise<void> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  if (!token || !richMenuId) return
  await fetch(`https://api.line.me/v2/bot/user/${lineUserId}/richmenu/${richMenuId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => {})
}

export async function unlinkRichMenuFromUser(lineUserId: string): Promise<void> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  if (!token) return
  await fetch(`https://api.line.me/v2/bot/user/${lineUserId}/richmenu`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => {})
}

