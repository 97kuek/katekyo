"use server"

import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { z } from "zod"
import { plantGardenItem } from "@/lib/garden"
import { scoreToGardenItemType } from "@/lib/garden-utils"

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
  studentId: z.string().min(1, "生徒を選択してください"),
  testName: z.string().min(1, "テスト名を入力してください"),
  date: z.string().min(1, "日付を入力してください"),
  testType: z.enum(TEST_TYPES).default("other"),
})

export async function createGradeRecord(
  _prevState: { error: string },
  formData: FormData
): Promise<{ error: string }> {
  const session = await auth()
  if (!session || session.user.role !== "teacher") {
    return { error: "権限がありません" }
  }

  const result = schema.safeParse({
    studentId: formData.get("studentId"),
    testName: formData.get("testName"),
    date: formData.get("date"),
    testType: formData.get("testType"),
  })
  if (!result.success) return { error: result.error.issues[0].message }

  const { studentId, testName, date, testType } = result.data

  const student = await db.student.findFirst({
    where: { id: studentId, teacherId: session.user.id },
  })
  if (!student) return { error: "指定された生徒が見つかりません" }

  const subjectIds = formData.getAll("subjectIds") as string[]

  const score = toOptionalInt(formData.get("score"))
  const maxScore = toOptionalInt(formData.get("maxScore"))
  const deviation = toOptionalFloat(formData.get("deviation"))

  await db.gradeRecord.create({
    data: {
      teacherId: session.user.id,
      studentId,
      testName,
      testType,
      date: new Date(date),
      score,
      maxScore,
      avgScore: toOptionalInt(formData.get("avgScore")),
      rank: toOptionalInt(formData.get("rank")),
      totalStudents: toOptionalInt(formData.get("totalStudents")),
      deviation,
      teacherRating: toOptionalInt(formData.get("teacherRating")),
      comment: (formData.get("comment") as string) || null,
      subjectIds,
    },
  })

  const itemType = scoreToGardenItemType(score, maxScore, deviation)
  if (itemType) {
    try {
      await plantGardenItem(studentId, itemType)
    } catch (err) {
      console.error("[garden] grade plant failed:", err)
    }
  }

  redirect("/grades?toast=created")
}
