"use server"

import { db } from "@/lib/db"
import { requireTeacher } from "@/lib/action-guards"
import { z } from "zod"
import { GRADE_OPTIONS } from "@/lib/grades"

const schema = z.object({
  name: z.string().min(1, "名前を入力してください"),
  grade: z.enum(GRADE_OPTIONS as unknown as [string, ...string[]], { error: "学年を選択してください" }),
})

export async function createInvite(
  _prevState: { error: string; token: string | null },
  formData: FormData
): Promise<{ error: string; token: string | null }> {
  const teacher = await requireTeacher()
  if (!teacher) {
    return { error: "権限がありません", token: null }
  }

  const result = schema.safeParse({
    name: formData.get("name"),
    grade: formData.get("grade"),
  })

  if (!result.success) {
    return { error: result.error.issues[0].message, token: null }
  }

  const { name, grade } = result.data

  await db.inviteToken.deleteMany({
    where: { teacherId: teacher.teacherId, expiresAt: { lt: new Date() }, usedAt: null },
  })

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const invite = await db.inviteToken.create({
    data: { teacherId: teacher.teacherId, name, grade, expiresAt },
  })

  return { error: "", token: invite.token }
}
