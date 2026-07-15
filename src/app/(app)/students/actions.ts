"use server"

import { db } from "@/lib/db"
import { requireTeacher } from "@/lib/action-guards"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { deleteHomeworkPhoto } from "@/lib/supabase-storage"
import { resetPasswordSchema } from "@/lib/validation"
import { validateTeacherSubjectIds } from "@/lib/tenant-validation"

export async function resetStudentPassword(
  _prevState: { error: string; success: boolean },
  formData: FormData
): Promise<{ error: string; success: boolean }> {
  const teacher = await requireTeacher()
  if (!teacher) return { error: "権限がありません", success: false }

  const result = resetPasswordSchema.safeParse({
    studentId: formData.get("studentId"),
    password: formData.get("password"),
  })
  if (!result.success) return { error: result.error.issues[0].message, success: false }

  const { studentId, password } = result.data

  const student = await db.student.findFirst({
    where: { id: studentId, teacherId: teacher.teacherId },
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

const ratesSchema = z.object({
  studentId: z.string().min(1),
  defaultHourlyRate: z.coerce.number().int().min(0).optional(),
  defaultTravelExpense: z.coerce.number().int().min(0).optional(),
  defaultDurationHours: z.coerce.number().min(0.5).optional(),
})

export async function updateStudentRates(
  _prevState: { error: string; success: boolean },
  formData: FormData
): Promise<{ error: string; success: boolean }> {
  const teacher = await requireTeacher()
  if (!teacher) return { error: "権限がありません", success: false }

  const raw = {
    studentId: formData.get("studentId"),
    defaultHourlyRate: formData.get("defaultHourlyRate") || undefined,
    defaultTravelExpense: formData.get("defaultTravelExpense") || undefined,
    defaultDurationHours: formData.get("defaultDurationHours") || undefined,
  }
  const result = ratesSchema.safeParse(raw)
  if (!result.success) return { error: result.error.issues[0].message, success: false }

  const { studentId, defaultHourlyRate, defaultTravelExpense, defaultDurationHours } = result.data

  const student = await db.student.findFirst({
    where: { id: studentId, teacherId: teacher.teacherId },
  })
  if (!student) return { error: "生徒が見つかりません", success: false }

  const defaultSubjectIds = await validateTeacherSubjectIds(teacher.teacherId, formData.getAll("defaultSubjectIds") as string[])
  if (!defaultSubjectIds) return { error: "無効な科目が含まれています", success: false }

  await db.student.update({
    where: { id: studentId },
    data: {
      defaultHourlyRate: defaultHourlyRate ?? null,
      defaultTravelExpense: defaultTravelExpense ?? null,
      defaultDurationMin: defaultDurationHours != null ? Math.round(defaultDurationHours * 60) : null,
      defaultSubjectIds,
    },
  })

  revalidatePath("/students")
  revalidatePath("/calendar")
  return { error: "", success: true }
}

export async function deleteStudent(formData: FormData) {
  const teacher = await requireTeacher()
  if (!teacher) redirect("/dashboard")

  const studentId = formData.get("studentId") as string
  if (!studentId) return

  const student = await db.student.findUnique({
    where: { id: studentId, teacherId: teacher.teacherId },
    select: { userId: true },
  })
  if (!student) return

  // Supabase Storage の宿題写真を先に削除（DB cascade では消えないため）
  const homeworkPhotos = await db.homework.findMany({
    where: { studentId, photoUrl: { not: null } },
    select: { photoUrl: true },
  })
  await Promise.allSettled(
    homeworkPhotos.map((h) => deleteHomeworkPhoto(h.photoUrl!))
  )

  await db.user.delete({ where: { id: student.userId } })
  revalidatePath("/students")
}
