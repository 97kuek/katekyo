"use server"

import { auth, signOut } from "@/lib/auth"
import { db } from "@/lib/db"
import { requireTeacher } from "@/lib/action-guards"
import { z } from "zod"
import { unlinkRichMenuFromUser } from "@/lib/line"
import { randomBytes } from "node:crypto"
import { isAllowedMeetUrl } from "@/lib/security-validation"

export async function generateLinkToken(): Promise<{ error?: string; token?: string }> {
  const session = await auth()
  if (!session) return { error: "認証が必要です" }

  // 48bit。6桁コードより総当たり耐性を大幅に高めつつ、LINEへコピーしやすい形式にする。
  const token = randomBytes(6).toString("hex").toUpperCase()
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
  meetLink: z.string().url("有効なURLを入力してください")
    .refine(isAllowedMeetUrl, "Google Meet のURLを入力してください")
    .or(z.literal("")),
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
  const teacher = await requireTeacher()
  if (!teacher) return { error: "権限がありません" }

  const result = meetLinkSchema.safeParse({ meetLink: formData.get("meetLink") })
  if (!result.success) return { error: result.error.issues[0].message }

  await db.user.update({
    where: { id: teacher.teacherId },
    data: { meetLink: result.data.meetLink || null },
  })

  return { success: true }
}
