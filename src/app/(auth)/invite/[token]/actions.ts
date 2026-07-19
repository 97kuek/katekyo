"use server"

import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { redirect } from "next/navigation"
import { z } from "zod"
import { invalidateStudent } from "@/lib/cache-invalidation"

const schema = z.object({
  token: z.string().min(1),
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(8, "パスワードは8文字以上で入力してください"),
})

export async function acceptInvite(
  _prevState: { error: string },
  formData: FormData
): Promise<{ error: string }> {
  const result = schema.safeParse({
    token: formData.get("token"),
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const { token, email, password } = result.data

  const INVALID_INVITE_ERROR = "招待リンクが無効または期限切れです"

  const invite = await db.inviteToken.findUnique({ where: { token } })
  if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
    return { error: INVALID_INVITE_ERROR }
  }

  const existingUser = await db.user.findUnique({ where: { email } })
  if (existingUser) {
    return { error: "このメールアドレスは既に登録されています" }
  }

  const hashed = await bcrypt.hash(password, 12)

  let createdStudent: { id: string; userId: string } | null = null
  try {
    createdStudent = await db.$transaction(async (tx) => {
      // usedAt が null の場合のみ使用済みにする（同時リクエストによる二重使用防止）
      const consumed = await tx.inviteToken.updateMany({
        where: { id: invite.id, usedAt: null, expiresAt: { gt: new Date() } },
        data: { usedAt: new Date() },
      })
      if (consumed.count !== 1) {
        throw new Error(INVALID_INVITE_ERROR)
      }
      const user = await tx.user.create({
        data: { email, name: invite.name, password: hashed, role: "student" },
      })
      return tx.student.create({
        data: { userId: user.id, teacherId: invite.teacherId, grade: invite.grade },
        select: { id: true, userId: true },
      })
    })
  } catch {
    return { error: INVALID_INVITE_ERROR }
  }

  invalidateStudent({
    teacherId: invite.teacherId,
    studentId: createdStudent.id,
    userId: createdStudent.userId,
  })

  redirect("/login?invited=1")
}
