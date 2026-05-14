"use server"

import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { z } from "zod"
import { GRADE_OPTIONS } from "@/lib/grades"

const schema = z.object({
  name: z.string().min(1, "名前を入力してください"),
  email: z.string().email("有効なメールアドレスを入力してください"),
  grade: z.enum(GRADE_OPTIONS as unknown as [string, ...string[]], { error: "学年を選択してください" }),
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
    name: formData.get("name"),
    email: formData.get("email"),
    grade: formData.get("grade"),
  })

  if (!result.success) {
    return { error: result.error.issues[0].message, token: null }
  }

  const { name, email, grade } = result.data

  const existingUser = await db.user.findUnique({ where: { email } })
  if (existingUser) {
    return { error: "このメールアドレスは既に登録されています", token: null }
  }

  const existingToken = await db.inviteToken.findFirst({
    where: { email, teacherId: session.user.id, usedAt: null, expiresAt: { gt: new Date() } },
  })
  if (existingToken) {
    return { error: "このメールアドレスへの有効な招待がすでに存在します", token: existingToken.token }
  }

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const invite = await db.inviteToken.create({
    data: { teacherId: session.user.id, name, email, grade, expiresAt },
  })

  return { error: "", token: invite.token }
}
