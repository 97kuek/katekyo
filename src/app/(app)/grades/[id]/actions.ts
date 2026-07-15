"use server"

import { db } from "@/lib/db"
import { requireTeacher } from "@/lib/action-guards"
import { redirect } from "next/navigation"
import { z } from "zod"
import { validateTeacherSubjectIds } from "@/lib/tenant-validation"

function toOptionalInt(val: FormDataEntryValue | null): number | null {
  if (!val || val === "") return null
  const n = parseInt(val as string, 10)
  return isNaN(n) ? null : n
}

function toOptionalFloat(val: FormDataEntryValue | null): number | null {
  if (!val || val === "") return null
  const n = parseFloat(val as string)
  return isNaN(n) ? null : n
}

const TEST_TYPES = ["mock", "exam", "quiz", "other"] as const

const schema = z.object({
  id: z.string().min(1),
  testName: z.string().min(1, "テスト名を入力してください"),
  date: z.string().min(1, "日付を入力してください"),
  testType: z.enum(TEST_TYPES).default("other"),
})

export async function updateGradeRecord(
  _prevState: { error: string },
  formData: FormData
): Promise<{ error: string }> {
  const teacher = await requireTeacher()
  if (!teacher) return { error: "権限がありません" }

  const result = schema.safeParse({
    id: formData.get("id"),
    testName: formData.get("testName"),
    date: formData.get("date"),
    testType: formData.get("testType"),
  })
  if (!result.success) return { error: result.error.issues[0].message }

  const { id, testName, date, testType } = result.data
  const subjectIds = await validateTeacherSubjectIds(teacher.teacherId, formData.getAll("subjectIds") as string[])
  if (!subjectIds) return { error: "無効な科目が含まれています" }

  const existing = await db.gradeRecord.findFirst({ where: { id, teacherId: teacher.teacherId } })
  if (!existing) return { error: "成績記録が見つかりません" }

  await db.gradeRecord.update({
    where: { id },
    data: {
      testName,
      testType,
      date: new Date(date),
      score: toOptionalInt(formData.get("score")),
      maxScore: toOptionalInt(formData.get("maxScore")),
      avgScore: toOptionalInt(formData.get("avgScore")),
      rank: toOptionalInt(formData.get("rank")),
      totalStudents: toOptionalInt(formData.get("totalStudents")),
      deviation: toOptionalFloat(formData.get("deviation")),
      teacherRating: toOptionalInt(formData.get("teacherRating")),
      comment: (formData.get("comment") as string) || null,
      subjectIds,
    },
  })

  redirect("/grades?toast=saved")
}

export async function deleteGradeRecord(formData: FormData) {
  const teacher = await requireTeacher()
  if (!teacher) redirect("/dashboard")

  const gradeId = formData.get("gradeId") as string
  if (!gradeId) return

  await db.gradeRecord.deleteMany({ where: { id: gradeId, teacherId: teacher.teacherId } })
  redirect("/grades?toast=deleted")
}
