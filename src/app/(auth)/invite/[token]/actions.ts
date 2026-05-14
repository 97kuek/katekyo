"use server"

import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { redirect } from "next/navigation"
import { z } from "zod"

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "パスワードは8文字以上で入力してください"),
})

export async function acceptInvite(
  _prevState: { error: string },
  formData: FormData
): Promise<{ error: string }> {
  const result = schema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  })

  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const { token, password } = result.data

  const invite = await db.inviteToken.findUnique({ where: { token } })
  if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
    return { error: "招待リンクが無効または期限切れです" }
  }

  const existingUser = await db.user.findUnique({ where: { email: invite.email } })
  if (existingUser) {
    return { error: "このメールアドレスは既に登録されています" }
  }

  const hashed = await bcrypt.hash(password, 10)

  await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email: invite.email, name: invite.name, password: hashed, role: "student" },
    })
    await tx.student.create({
      data: { userId: user.id, teacherId: invite.teacherId, grade: invite.grade },
    })
    await tx.inviteToken.update({
      where: { id: invite.id },
      data: { usedAt: new Date() },
    })
  })

  redirect("/login?invited=1")
}
