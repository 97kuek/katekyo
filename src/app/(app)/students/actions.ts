"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import bcrypt from "bcryptjs"

const resetSchema = z.object({
  studentId: z.string().min(1),
  password: z.string().min(8, "パスワードは8文字以上にしてください"),
})

export async function resetStudentPassword(
  _prevState: { error: string; success: boolean },
  formData: FormData
): Promise<{ error: string; success: boolean }> {
  const session = await auth()
  if (!session || session.user.role !== "teacher") return { error: "権限がありません", success: false }

  const result = resetSchema.safeParse({
    studentId: formData.get("studentId"),
    password: formData.get("password"),
  })
  if (!result.success) return { error: result.error.issues[0].message, success: false }

  const { studentId, password } = result.data

  const student = await db.student.findFirst({
    where: { id: studentId, teacherId: session.user.id },
    select: { userId: true },
  })
  if (!student) return { error: "生徒が見つかりません", success: false }

  const hashed = await bcrypt.hash(password, 12)
  await db.user.update({
    where: { id: student.userId },
    data: { password: hashed },
  })

  revalidatePath("/students")
  return { error: "", success: true }
}

export async function deleteStudent(formData: FormData) {
  const session = await auth()
  if (!session || session.user.role !== "teacher") redirect("/dashboard")

  const studentId = formData.get("studentId") as string
  if (!studentId) return

  const student = await db.student.findUnique({
    where: { id: studentId, teacherId: session.user.id },
    select: { userId: true },
  })
  if (!student) return

  await db.user.delete({ where: { id: student.userId } })
  revalidatePath("/students")
}
