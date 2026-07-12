/**
 * 授業料の計算ロジック。/billing 画面・CSV エクスポート・LINE 月次レポートで共通利用する
 * （計算式が場所によってずれるのを防ぐため、必ずここを使う）。
 */

import type { LessonType } from "@/generated/prisma/enums"

type LessonFeeInput = {
  durationMin: number | null
  hourlyRate: number | null
  travelExpense: number | null
  type: LessonType
}

/**
 * 授業料の内訳。lessonFee = 時給 × 時間（分単位を時換算し四捨五入）。
 * 仕様（docs/requirements.md）: オンライン授業の交通費は 0。
 * 書き込み時にも 0 を強制しているが、防御的にここでも適用する。
 */
export function calcFeeBreakdown(lesson: LessonFeeInput): { lessonFee: number; total: number } {
  const { durationMin, hourlyRate, travelExpense, type } = lesson
  const lessonFee =
    durationMin && hourlyRate ? Math.round((durationMin / 60) * hourlyRate) : 0
  const travel = type === "online" ? 0 : (travelExpense ?? 0)
  return { lessonFee, total: lessonFee + travel }
}

/** 授業1コマの請求額（授業料 + 交通費）。料金情報が未設定なら null */
export function calcFee(lesson: LessonFeeInput): number | null {
  if (!lesson.hourlyRate && !lesson.travelExpense) return null
  return calcFeeBreakdown(lesson).total
}
