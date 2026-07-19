"use server"

import { db } from "@/lib/db"
import { requireTeacher } from "@/lib/action-guards"
import { redirect } from "next/navigation"
import { plantGardenItem } from "@/lib/garden/actions"
import { validateTeacherSubjectIds } from "@/lib/tenant-validation"
import { evaluateGrade, gradeDateFromInput, gradeRecordInputFromFormData } from "@/lib/grade-record"

export async function createGradeRecord(
  _prevState: { error: string },
  formData: FormData
): Promise<{ error: string }> {
  const teacher = await requireTeacher()
  if (!teacher) {
    return { error: "権限がありません" }
  }

  const result = gradeRecordInputFromFormData(formData)
  if (!result.success) return { error: result.error.issues[0].message }

  const { studentId, testName, date, testType, score, maxScore, avgScore, rank, totalStudents, deviation, comment } = result.data
  if (!studentId) return { error: "生徒を選択してください" }

  const student = await db.student.findFirst({
    where: { id: studentId, teacherId: teacher.teacherId },
  })
  if (!student) return { error: "指定された生徒が見つかりません" }

  const subjectIds = await validateTeacherSubjectIds(teacher.teacherId, formData.getAll("subjectIds") as string[])
  if (!subjectIds) return { error: "無効な科目が含まれています" }

  const grade = await db.gradeRecord.create({
    data: {
      teacherId: teacher.teacherId,
      studentId,
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
      gardenEvaluationVersion: 1,
      subjectIds,
    },
  })

  const evaluation = evaluateGrade({ testType, score, maxScore, deviation })
  if (evaluation) {
    try {
      await plantGardenItem(studentId, evaluation.itemType, grade.id)
    } catch (err) {
      console.error("[garden] grade plant failed:", err)
    }
  }

  redirect("/grades?toast=created")
}
