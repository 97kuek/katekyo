"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { z } from "zod"

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

const schema = z.object({
  id: z.string().min(1),
  testName: z.string().min(1, "テスト名を入力してください"),
  date: z.string().min(1, "日付を入力してください"),
})

export async function updateGradeRecord(
  _prevState: { error: string },
  formData: FormData
): Promise<{ error: string }> {
  const session = await auth()
  if (!session || session.user.role !== "teacher") return { error: "権限がありません" }

  const result = schema.safeParse({
    id: formData.get("id"),
    testName: formData.get("testName"),
    date: formData.get("date"),
  })
  if (!result.success) return { error: result.error.issues[0].message }

  const { id, testName, date } = result.data
  const subjectIds = formData.getAll("subjectIds") as string[]

  const existing = await db.gradeRecord.findFirst({ where: { id, teacherId: session.user.id } })
  if (!existing) return { error: "成績記録が見つかりません" }

  await db.gradeRecord.update({
    where: { id },
    data: {
      testName,
      date: new Date(date),
      score: toOptionalInt(formData.get("score")),
      maxScore: toOptionalInt(formData.get("maxScore")),
      rank: toOptionalInt(formData.get("rank")),
      totalStudents: toOptionalInt(formData.get("totalStudents")),
      deviation: toOptionalFloat(formData.get("deviation")),
      teacherRating: toOptionalInt(formData.get("teacherRating")),
      comment: (formData.get("comment") as string) || null,
      subjectIds,
    },
  })

  redirect("/grades")
}

export async function deleteGradeRecord(formData: FormData) {
  const session = await auth()
  if (!session || session.user.role !== "teacher") redirect("/dashboard")

  const gradeId = formData.get("gradeId") as string
  if (!gradeId) return

  await db.gradeRecord.deleteMany({ where: { id: gradeId, teacherId: session.user.id } })
  revalidatePath("/grades")
  redirect("/grades")
}
