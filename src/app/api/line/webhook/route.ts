import { createHmac, timingSafeEqual } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendLineMessage, linkRichMenuToUser } from "@/lib/line"

function verifySignature(body: string, signature: string): boolean {
  const secret = process.env.LINE_CHANNEL_SECRET
  if (!secret) return false
  const hash = createHmac("SHA256", secret).update(body).digest()
  const provided = Buffer.from(signature, "base64")
  return hash.length === provided.length && timingSafeEqual(hash, provided)
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get("x-line-signature") ?? ""

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  const body = JSON.parse(rawBody)
  const events = body.events ?? []

  for (const event of events) {
    const lineUserId: string = event.source?.userId
    if (!lineUserId) continue

    if (event.type === "follow") {
      await sendLineMessage(
        lineUserId,
        "katekyoへようこそ！\n\nLINE通知を受け取るには、アプリの「設定」ページで12桁のコードを発行し、ここに送信してください。"
      )
      continue
    }

    if (event.type === "message" && event.message?.type === "text") {
      const text: string = event.message.text.trim()

      if (/^[0-9A-F]{12}$/i.test(text)) {
        const now = new Date()
        const linkToken = await db.lineLinkToken.findUnique({
          where: { token: text },
          include: { user: true },
        })

        if (!linkToken || linkToken.expiresAt < now) {
          await sendLineMessage(lineUserId, "コードが無効または期限切れです。\nアプリの「設定」ページで新しいコードを発行してください。")
          continue
        }

        const linked = await db.$transaction(async (tx) => {
          const consumed = await tx.lineLinkToken.deleteMany({
            where: { id: linkToken.id, expiresAt: { gt: now } },
          })
          if (consumed.count !== 1) return false
          await tx.user.update({
            where: { id: linkToken.userId },
            data: { lineUserId },
          })
          return true
        })
        if (!linked) {
          await sendLineMessage(lineUserId, "コードが無効または期限切れです。")
          continue
        }

        const richMenuId = linkToken.user.role === "teacher"
          ? process.env.LINE_RICH_MENU_TEACHER_ID
          : process.env.LINE_RICH_MENU_STUDENT_ID
        if (richMenuId) await linkRichMenuToUser(lineUserId, richMenuId)

        await sendLineMessage(lineUserId, `${linkToken.user.name}さんのLINE連携が完了しました✅\nこれからkatekyoの通知をお届けします。`)

        if (linkToken.user.role === "student") {
          const student = await db.student.findUnique({
            where: { userId: linkToken.userId },
            include: { teacher: { select: { lineUserId: true } } },
          })
          if (student?.teacher.lineUserId) {
            await sendLineMessage(
              student.teacher.lineUserId,
              `📲 ${linkToken.user.name}さんがLINE連携を完了しました\nこれから通知が届くようになります。`
            )
          }
        }

        continue
      }

      await sendLineMessage(lineUserId, "12桁の連携コードを送信してください。\nコードはアプリの「設定」ページで発行できます。")
    }
  }

  return NextResponse.json({ ok: true })
}
