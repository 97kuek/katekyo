"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getStudentByUserId } from "@/lib/queries"

export async function createParentInviteAsStudent(
  _prevState: { error: string; token: string | null },
  _formData: FormData
): Promise<{ error: string; token: string | null }> {
  const session = await auth()
  if (!session || session.user.role !== "student") return { error: "権限がありません", token: null }

  const student = await getStudentByUserId(session.user.id)
  if (!student) return { error: "生徒情報が見つかりません", token: null }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const invite = await db.parentInviteToken.create({
    data: { teacherId: student.teacherId, studentId: student.id, expiresAt },
  })

  return { error: "", token: invite.token }
}
