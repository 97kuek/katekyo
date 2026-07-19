"use server"

import { db } from "@/lib/db"
import { requireTeacher } from "@/lib/action-guards"
import { redirect } from "next/navigation"
import { validateTeacherSubjectIds } from "@/lib/tenant-validation"
import { evaluateGrade, gradeDateFromInput, gradeRecordInputFromFormData } from "@/lib/grade-record"
import { syncGradeGardenItem } from "@/lib/garden/actions"

export async function updateGradeRecord(
  _prevState: { error: string },
  formData: FormData
): Promise<{ error: string }> {
  const teacher = await requireTeacher()
  if (!teacher) return { error: "権限がありません" }

  const id = formData.get("id")?.toString()
  if (!id) return { error: "成績記録が見つかりません" }
  const result = gradeRecordInputFromFormData(formData)
  if (!result.success) return { error: result.error.issues[0].message }

  const { testName, date, testType, score, maxScore, avgScore, rank, totalStudents, deviation, comment } = result.data
  const subjectIds = await validateTeacherSubjectIds(teacher.teacherId, formData.getAll("subjectIds") as string[])
  if (!subjectIds) return { error: "無効な科目が含まれています" }

  const existing = await db.gradeRecord.findFirst({ where: { id, teacherId: teacher.teacherId } })
  if (!existing) return { error: "成績記録が見つかりません" }

  await db.gradeRecord.update({
    where: { id },
    data: {
      testName,
      testType,
      date: gradeDateFromInput(date),
      score,
      maxScore,
      avgScore,
      rank,
      totalStudents,
      deviation,
      comment,
      subjectIds,
    },
  })

  // 移行前の成績は由来を追跡できず、重複付与する恐れがあるため同期対象にしない。
  if (existing.gardenEvaluationVersion === 1) {
    const evaluation = evaluateGrade({ testType, score, maxScore, deviation })
    await syncGradeGardenItem(id, existing.studentId, evaluation?.itemType ?? null)
  }

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
