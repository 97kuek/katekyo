import { z } from "zod"
import type { GardenItemType } from "@/lib/garden/utils"
import { testTypeSchema } from "@/lib/validation"
import type { TestType } from "@/lib/test-types"

const optionalInteger = (label: string, min: number, max: number) =>
  z.preprocess(
    (value) => value === "" || value == null ? null : Number(value),
    z.number({ message: `${label}は数値で入力してください` })
      .int(`${label}は整数で入力してください`)
      .min(min, `${label}は${min}以上で入力してください`)
      .max(max, `${label}は${max}以下で入力してください`)
      .nullable()
  )

const optionalDecimal = (label: string, min: number, max: number) =>
  z.preprocess(
    (value) => value === "" || value == null ? null : Number(value),
    z.number({ message: `${label}は数値で入力してください` })
      .min(min, `${label}は${min}以上で入力してください`)
      .max(max, `${label}は${max}以下で入力してください`)
      .nullable()
  )

export const gradeRecordInputSchema = z.object({
  studentId: z.string().min(1, "生徒を選択してください").optional(),
  testName: z.string().trim().min(1, "テスト名を入力してください").max(100, "テスト名は100文字以内にしてください"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "実施日を入力してください").refine((value) => {
    const [year, month, day] = value.split("-").map(Number)
    const parsed = new Date(Date.UTC(year, month - 1, day))
    return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day
  }, "正しい実施日を入力してください"),
  testType: testTypeSchema,
  score: optionalInteger("得点", 0, 10000),
  maxScore: optionalInteger("満点", 1, 10000),
  avgScore: optionalInteger("平均点", 0, 10000),
  rank: optionalInteger("順位", 1, 1000000),
  totalStudents: optionalInteger("受験者数", 1, 1000000),
  deviation: optionalDecimal("偏差値", 0, 100),
  comment: z.string().trim().max(2000, "コメントは2000文字以内にしてください").nullable(),
}).superRefine((value, ctx) => {
  if ((value.score == null) !== (value.maxScore == null)) {
    ctx.addIssue({ code: "custom", message: "得点と満点はセットで入力してください", path: [value.score == null ? "score" : "maxScore"] })
  }
  if (value.score != null && value.maxScore != null && value.score > value.maxScore) {
    ctx.addIssue({ code: "custom", message: "得点は満点以下で入力してください", path: ["score"] })
  }
  if (value.avgScore != null && value.maxScore == null) {
    ctx.addIssue({ code: "custom", message: "平均点を入力する場合は満点も入力してください", path: ["avgScore"] })
  }
  if (value.avgScore != null && value.maxScore != null && value.avgScore > value.maxScore) {
    ctx.addIssue({ code: "custom", message: "平均点は満点以下で入力してください", path: ["avgScore"] })
  }
  if ((value.rank == null) !== (value.totalStudents == null)) {
    ctx.addIssue({ code: "custom", message: "順位と受験者数はセットで入力してください", path: [value.rank == null ? "rank" : "totalStudents"] })
  }
  if (value.rank != null && value.totalStudents != null && value.rank > value.totalStudents) {
    ctx.addIssue({ code: "custom", message: "順位は受験者数以下で入力してください", path: ["rank"] })
  }
})

export type GradeRecordInput = z.infer<typeof gradeRecordInputSchema>

export function gradeRecordInputFromFormData(formData: FormData) {
  return gradeRecordInputSchema.safeParse({
    studentId: formData.get("studentId")?.toString() || undefined,
    testName: formData.get("testName"),
    date: formData.get("date"),
    testType: formData.get("testType"),
    score: formData.get("score"),
    maxScore: formData.get("maxScore"),
    avgScore: formData.get("avgScore"),
    rank: formData.get("rank"),
    totalStudents: formData.get("totalStudents"),
    deviation: formData.get("deviation"),
    comment: formData.get("comment")?.toString() || null,
  })
}

export function scorePercentage(score: number | null, maxScore: number | null): number | null {
  if (score == null || maxScore == null || maxScore <= 0) return null
  return (score / maxScore) * 100
}

export type GradeEvaluation = {
  source: "score" | "deviation"
  value: number
  itemType: GardenItemType
}

function itemForScorePercentage(value: number): GardenItemType {
  if (value >= 100) return "bamboo"
  if (value >= 90) return "cherry"
  if (value >= 80) return "tree"
  if (value >= 60) return "bush"
  return "flower"
}

function itemForDeviation(value: number): GardenItemType {
  if (value >= 70) return "bamboo"
  if (value >= 65) return "cherry"
  if (value >= 60) return "tree"
  if (value >= 50) return "bush"
  return "flower"
}

export function evaluateGrade(input: {
  testType: TestType
  score: number | null
  maxScore: number | null
  deviation: number | null
}): GradeEvaluation | null {
  const percentage = scorePercentage(input.score, input.maxScore)
  const preferDeviation = input.testType === "mock"

  if (preferDeviation && input.deviation != null) {
    return { source: "deviation", value: input.deviation, itemType: itemForDeviation(input.deviation) }
  }
  if (percentage != null) {
    return { source: "score", value: percentage, itemType: itemForScorePercentage(percentage) }
  }
  if (input.deviation != null) {
    return { source: "deviation", value: input.deviation, itemType: itemForDeviation(input.deviation) }
  }
  return null
}

export function gradeDateFromInput(date: string) {
  // 日付専用フィールドはUTC 00:00で保存し、toISOString().slice(0, 10)との往復を安定させる。
  return new Date(`${date}T00:00:00.000Z`)
}
