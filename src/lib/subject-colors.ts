// 科目タグに割り当てる色のキュレーション済みパレット。
// 自由色入力は雑多になりやすいため、落ち着いた識別しやすい固定セットから選ばせる。
export const SUBJECT_COLORS = [
  "#2e743a", // green（テーマ）
  "#2563eb", // blue
  "#0d9488", // teal
  "#7c3aed", // violet
  "#4f46e5", // indigo
  "#d97706", // amber
  "#db2777", // pink
  "#dc2626", // red
  "#64748b", // slate
] as const

export type SubjectColor = (typeof SUBJECT_COLORS)[number]

export function isValidSubjectColor(value: unknown): value is SubjectColor {
  return typeof value === "string" && (SUBJECT_COLORS as readonly string[]).includes(value)
}

// パレット未割り当て科目に使うフォールバック（チャート上でローテーション）
export const FALLBACK_LINE_COLORS = [
  "var(--primary)",
  "var(--chart-1)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-2)",
]
