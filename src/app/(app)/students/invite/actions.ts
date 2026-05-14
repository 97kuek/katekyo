"use server"

import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { z } from "zod"

const schema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  name: z.string().min(1, "名前を入力してください"),
  grade: z.string().min(1, "学年を入力してください"),
})

export async function createInvite(
  _prevState: { error: string; token: string | null },
  formData: FormData
): Promise<{ error: string; token: string | null }> {
  const session = await auth()
  if (!session || session.user.role !== "teacher") {
    return { error: "権限がありません", token: null }
  }

  const result = schema.safeParse({
    email: formData.get("email"),
    name: formData.get("name"),
    grade: formData.get("grade"),
  })

  if (!result.success) {
    return { error: result.error.issues[0].message, token: null }
  }

  const { email, name, grade } = result.data

  const existingUser = await db.user.findUnique({ where: { email } })
  if (existingUser) {
    return { error: "このメールアドレスは既に登録されています", token: null }
  }

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const invite = await db.inviteToken.create({
    data: { teacherId: session.user.id, email, name, grade, expiresAt },
  })

  return { error: "", token: invite.token }
}
