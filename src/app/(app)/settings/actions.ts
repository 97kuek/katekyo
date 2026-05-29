"use server"

import { auth, signOut } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"
import { unlinkRichMenuFromUser } from "@/lib/line"

export async function generateLinkToken(): Promise<{ error?: string; token?: string }> {
  const session = await auth()
  if (!session) return { error: "認証が必要です" }

  const token = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

  await db.lineLinkToken.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, token, expiresAt },
    update: { token, expiresAt },
  })

  return { token }
}

export async function unlinkLine(): Promise<{ error?: string }> {
  const session = await auth()
  if (!session) return { error: "認証が必要です" }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { lineUserId: true },
  })
  if (user?.lineUserId) {
    await unlinkRichMenuFromUser(user.lineUserId)
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { lineUserId: null },
  })

  return {}
}

const meetLinkSchema = z.object({
  meetLink: z.string().url("有効なURLを入力してください").includes("meet.google.com", { message: "Google Meet のURLを入力してください" }).or(z.literal("")),
})

export async function deleteParentAccount(): Promise<{ error: string }> {
  const session = await auth()
  if (!session || session.user.role !== "parent") return { error: "権限がありません" }

  await db.user.delete({ where: { id: session.user.id } })
  await signOut({ redirectTo: "/login" })
  return { error: "" }
}

export async function saveMeetLink(
  _prevState: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const session = await auth()
  if (!session || session.user.role !== "teacher") return { error: "権限がありません" }

  const result = meetLinkSchema.safeParse({ meetLink: formData.get("meetLink") })
  if (!result.success) return { error: result.error.issues[0].message }

  await db.user.update({
    where: { id: session.user.id },
    data: { meetLink: result.data.meetLink || null },
  })

  return { success: true }
}
