"use server"

import { db } from "@/lib/db"
import { requireTeacher } from "@/lib/action-guards"
import { z } from "zod"

const schema = z.object({
  studentId: z.string().min(1),
  email: z.string().email("有効なメールアドレスを入力してください").optional().or(z.literal("")),
})

export async function createParentInvite(
  _prevState: { error: string; token: string | null },
  formData: FormData
): Promise<{ error: string; token: string | null }> {
  const teacher = await requireTeacher()
  if (!teacher) return { error: "権限がありません", token: null }

  const raw = {
    studentId: formData.get("studentId") as string,
    email: (formData.get("email") as string) || undefined,
  }
  const result = schema.safeParse(raw)
  if (!result.success) return { error: result.error.issues[0].message, token: null }

  const { studentId, email } = result.data

  // 先生の生徒か確認
  const student = await db.student.findFirst({
    where: { id: studentId, teacherId: teacher.teacherId },
  })
  if (!student) return { error: "生徒が見つかりません", token: null }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const invite = await db.parentInviteToken.create({
    data: { teacherId: teacher.teacherId, studentId, email: email || null, expiresAt },
  })

  return { error: "", token: invite.token }
}
