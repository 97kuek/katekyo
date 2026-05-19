"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import bcrypt from "bcryptjs"

export async function updateName(
  _prevState: { error: string; success?: string },
  formData: FormData
): Promise<{ error: string; success?: string }> {
  const session = await auth()
  if (!session) return { error: "ログインしてください" }

  const name = (formData.get("name") as string)?.trim()
  if (!name || name.length === 0) return { error: "名前を入力してください" }
  if (name.length > 50) return { error: "名前は50文字以内で入力してください" }

  await db.user.update({ where: { id: session.user.id }, data: { name } })
  revalidatePath("/settings")
  revalidatePath("/profile")
  return { error: "", success: "名前を更新しました" }
}

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "現在のパスワードを入力してください"),
  newPassword: z.string().min(8, "新しいパスワードは8文字以上で入力してください"),
})

export async function updatePassword(
  _prevState: { error: string; success?: string },
  formData: FormData
): Promise<{ error: string; success?: string }> {
  const session = await auth()
  if (!session) return { error: "ログインしてください" }

  const result = passwordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
  })
  if (!result.success) return { error: result.error.issues[0].message }

  const { currentPassword, newPassword } = result.data

  const user = await db.user.findUnique({ where: { id: session.user.id } })
  if (!user) return { error: "ユーザーが見つかりません" }

  const valid = await bcrypt.compare(currentPassword, user.password)
  if (!valid) return { error: "現在のパスワードが正しくありません" }

  const hashed = await bcrypt.hash(newPassword, 12)
  await db.user.update({ where: { id: session.user.id }, data: { password: hashed } })
  return { error: "", success: "パスワードを変更しました" }
}
