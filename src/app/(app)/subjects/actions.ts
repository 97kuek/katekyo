"use server"

import { db } from "@/lib/db"
import { requireTeacher } from "@/lib/action-guards"
import { invalidateSubjects } from "@/lib/cache-invalidation"
import { z } from "zod"
import { isValidSubjectColor } from "@/lib/subject-colors"

const schema = z.object({
  name: z.string().min(1, "科目名を入力してください").max(50, "科目名は50文字以内で入力してください"),
  color: z.string().refine(isValidSubjectColor, "無効な色です").optional().nullable(),
})

export async function createSubject(
  _prevState: { error: string; success: boolean },
  formData: FormData
): Promise<{ error: string; success: boolean }> {
  const teacher = await requireTeacher()
  if (!teacher) {
    return { error: "権限がありません", success: false }
  }

  const rawColor = formData.get("color")
  const result = schema.safeParse({
    name: formData.get("name"),
    color: rawColor ? String(rawColor) : null,
  })
  if (!result.success) return { error: result.error.issues[0].message, success: false }

  const { name, color } = result.data

  const existing = await db.subject.findFirst({
    where: { name, teacherId: teacher.teacherId },
  })
  if (existing) return { error: "この科目名は既に存在します", success: false }

  await db.subject.create({ data: { name, color: color ?? null, teacherId: teacher.teacherId } })
  invalidateSubjects(teacher.teacherId)
  return { error: "", success: true }
}

export async function deleteSubject(formData: FormData) {
  const teacher = await requireTeacher()
  if (!teacher) return

  const result = z.string().min(1).safeParse(formData.get("id"))
  if (!result.success) return
  const id = result.data
  const teacherId = teacher.teacherId

  const subject = await db.subject.findFirst({ where: { id, teacherId } })
  if (!subject) return

  // subjectIds は FK 制約のない String[] のため、削除時に各テーブルから
  // 該当IDを取り除かないと孤児IDが静かに残り続ける
  await db.$transaction([
    db.subject.deleteMany({ where: { id, teacherId } }),
    db.$executeRaw`UPDATE "Homework" SET "subjectIds" = array_remove("subjectIds", ${id}) WHERE "teacherId" = ${teacherId} AND ${id} = ANY("subjectIds")`,
    db.$executeRaw`UPDATE "GradeRecord" SET "subjectIds" = array_remove("subjectIds", ${id}) WHERE "teacherId" = ${teacherId} AND ${id} = ANY("subjectIds")`,
    db.$executeRaw`UPDATE "Lesson" SET "subjectIds" = array_remove("subjectIds", ${id}) WHERE "teacherId" = ${teacherId} AND ${id} = ANY("subjectIds")`,
    db.$executeRaw`UPDATE "StudentMaterial" SET "subjectIds" = array_remove("subjectIds", ${id}) WHERE "teacherId" = ${teacherId} AND ${id} = ANY("subjectIds")`,
    db.$executeRaw`UPDATE "Student" SET "defaultSubjectIds" = array_remove("defaultSubjectIds", ${id}) WHERE "teacherId" = ${teacherId} AND ${id} = ANY("defaultSubjectIds")`,
  ])
  invalidateSubjects(teacherId)
}

export async function updateSubjectColor(formData: FormData) {
  const teacher = await requireTeacher()
  if (!teacher) return

  const id = formData.get("id") as string
  const rawColor = formData.get("color")
  const color = rawColor ? String(rawColor) : null
  if (color !== null && !isValidSubjectColor(color)) return

  await db.subject.updateMany({
    where: { id, teacherId: teacher.teacherId },
    data: { color },
  })
  invalidateSubjects(teacher.teacherId)
}
