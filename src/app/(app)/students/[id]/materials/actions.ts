"use server"

import { db } from "@/lib/db"
import { requireTeacher } from "@/lib/action-guards"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { validateTeacherSubjectIds } from "@/lib/tenant-validation"

const createSchema = z.object({
  studentId: z.string().min(1),
  name: z.string().min(1, "教材名を入力してください").max(100),
  note: z.string().max(200).optional(),
})

export async function createMaterial(
  _prevState: { error: string },
  formData: FormData
): Promise<{ error: string }> {
  const teacher = await requireTeacher()
  if (!teacher) return { error: "権限がありません" }

  const result = createSchema.safeParse({
    studentId: formData.get("studentId"),
    name: formData.get("name"),
    note: formData.get("note") || undefined,
  })
  if (!result.success) return { error: result.error.issues[0].message }

  const { studentId, name, note } = result.data
  const subjectIds = await validateTeacherSubjectIds(teacher.teacherId, formData.getAll("subjectIds") as string[])
  if (!subjectIds) return { error: "無効な科目が含まれています" }

  const student = await db.student.findFirst({
    where: { id: studentId, teacherId: teacher.teacherId },
  })
  if (!student) return { error: "生徒が見つかりません" }

  await db.studentMaterial.create({
    data: { studentId, teacherId: teacher.teacherId, name, note: note ?? null, subjectIds },
  })

  revalidatePath(`/students/${studentId}/materials`)
  return { error: "" }
}

export async function deleteMaterial(materialId: string, studentId: string): Promise<{ error: string }> {
  const teacher = await requireTeacher()
  if (!teacher) return { error: "権限がありません" }

  await db.studentMaterial.deleteMany({
    where: { id: materialId, teacherId: teacher.teacherId },
  })

  revalidatePath(`/students/${studentId}/materials`)
  return { error: "" }
}

export async function updateMaterialSubjects(
  materialId: string,
  studentId: string,
  subjectIds: string[]
): Promise<{ error: string }> {
  const teacher = await requireTeacher()
  if (!teacher) return { error: "権限がありません" }

  const validSubjectIds = await validateTeacherSubjectIds(teacher.teacherId, subjectIds)
  if (!validSubjectIds) return { error: "無効な科目が含まれています" }

  const material = await db.studentMaterial.findFirst({
    where: { id: materialId, teacherId: teacher.teacherId, studentId },
  })
  if (!material) return { error: "教材が見つかりません" }

  await db.studentMaterial.update({
    where: { id: materialId },
    data: { subjectIds: validSubjectIds },
  })

  revalidatePath(`/students/${studentId}/materials`)
  return { error: "" }
}
