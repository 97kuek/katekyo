import type { HomeworkStatus, HomeworkEventType } from "@/generated/prisma/enums"

/**
 * 宿題ステータスの表示設定（ラベル・ドット色）。
 * 表記ゆれ防止のため、ステータス表示は必ずここを参照する。
 */
export const HOMEWORK_STATUS_CONFIG: Record<
  HomeworkStatus,
  { label: string; dot: string }
> = {
  assigned:  { label: "未提出",   dot: "bg-muted-foreground/50" },
  submitted: { label: "提出済み", dot: "bg-warning" },
  approved:  { label: "承認済み", dot: "bg-primary" },
  rejected:  { label: "差し戻し", dot: "bg-destructive" },
}

/** 宿題履歴イベントの表示ラベル */
export const HOMEWORK_EVENT_LABELS: Record<HomeworkEventType, string> = {
  submitted: "提出",
  approved: "承認",
  rejected: "差し戻し",
}

/** 生徒側の対応が必要な（＝未完了とみなす）ステータス */
export const PENDING_STATUSES = ["assigned", "rejected"] satisfies HomeworkStatus[]

/** 生徒側の対応が必要な（＝未完了とみなす）ステータスかどうか */
export function isPendingStatus(status: HomeworkStatus): boolean {
  return status === "assigned" || status === "rejected"
}
