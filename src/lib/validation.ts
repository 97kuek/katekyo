import { z } from "zod"

export const testTypeSchema = z.enum(["mock", "exam", "quiz", "other"]).default("other")

export const createHomeworkSchema = z.object({
  studentId: z.string().min(1, "生徒を選択してください"),
  title: z.string().min(1, "タイトルを入力してください"),
  description: z.string().optional(),
  dueDate: z.string().min(1, "期限を設定してください"),
  materialId: z.string().optional(),
  requiresPhoto: z.string().optional(),
})

export const submitHomeworkSchema = z.object({
  id: z.string().min(1),
  note: z.string().optional(),
  difficultyRating: z.coerce.number().int().min(1).max(3).optional(),
})

export const createLessonSchema = z.object({
  studentId: z.string().min(1, "生徒を選択してください"),
  date: z.string().min(1, "日付を入力してください"),
  time: z.string().min(1, "時刻を入力してください"),
  type: z.enum(["online", "offline"]),
  durationMin: z.string().optional(),
  notes: z.string().optional(),
  hourlyRate: z.coerce.number().int().min(0).optional(),
  travelExpense: z.coerce.number().int().min(0).optional(),
  repeatWeeks: z.string().optional(),
})

export const resetPasswordSchema = z.object({
  studentId: z.string().min(1),
  password: z.string().min(8, "パスワードは8文字以上にしてください"),
})
