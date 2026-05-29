"use server"

import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { redirect } from "next/navigation"
import { z } from "zod"

const schema = z.object({
  token: z.string().min(1),
  name: z.string().min(1, "名前を入力してください"),
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(8, "パスワードは8文字以上で入力してください"),
})

export async function acceptParentInvite(
  _prevState: { error: string; loginRedirect?: string },
  formData: FormData
): Promise<{ error: string; loginRedirect?: string }> {
  const result = schema.safeParse({
    token: formData.get("token"),
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!result.success) return { error: result.error.issues[0].message }

  const { token, name, email, password } = result.data

  const invite = await db.parentInviteToken.findUnique({
    where: { token },
    include: { student: { select: { teacherId: true } } },
  })
  if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
    return { error: "招待リンクが無効または期限切れです" }
  }

  const existingUser = await db.user.findUnique({ where: { email } })
  if (existingUser) {
    return {
      error: "このメールアドレスはすでに登録されています。",
      loginRedirect: `/login?next=/parent-invite/${token}`,
    }
  }

  const hashed = await bcrypt.hash(password, 10)

  await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email, name, password: hashed, role: "parent" },
    })
    await tx.parentStudent.create({
      data: { parentId: user.id, studentId: invite.studentId, teacherId: invite.student.teacherId },
    })
    await tx.parentInviteToken.update({
      where: { id: invite.id },
      data: { usedAt: new Date() },
    })
  })

  redirect("/login?invited=1")
}

export async function linkExistingParent(token: string, parentId: string): Promise<{ error: string }> {
  const invite = await db.parentInviteToken.findUnique({
    where: { token },
    include: { student: { select: { teacherId: true } } },
  })
  if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
    return { error: "招待リンクが無効または期限切れです" }
  }

  const existing = await db.parentStudent.findUnique({
    where: { parentId_studentId: { parentId, studentId: invite.studentId } },
  })
  if (existing) {
    redirect("/dashboard")
  }

  await db.$transaction(async (tx) => {
    await tx.parentStudent.create({
      data: { parentId, studentId: invite.studentId, teacherId: invite.student.teacherId },
    })
    await tx.parentInviteToken.update({
      where: { id: invite.id },
      data: { usedAt: new Date() },
    })
  })

  redirect("/dashboard")
}
