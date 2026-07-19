"use client"

import Link from "next/link"
import { Pencil, Trash2 } from "lucide-react"
import { haptic } from "@/lib/haptic"

type Props = {
  /** 編集ページへのリンク。省略時は削除ボタンのみ表示 */
  editHref?: string
  confirming: boolean
  onConfirmingChange: (confirming: boolean) => void
  isPending: boolean
  onDelete: () => void
}

/**
 * SwipeableRow の `actions` に入れる共通の編集/削除ボタン。
 * 削除は「確認→実行」の2ステップを挟み、スワイプだけでは破壊的操作を実行しない。
 */
export function SwipeEditDeleteActions({
  editHref,
  confirming,
  onConfirmingChange,
  isPending,
  onDelete,
}: Props) {
  if (confirming) {
    return (
      <div className="flex w-full items-center justify-center gap-2 bg-destructive/10 px-2">
        <button className="min-h-11 px-2 text-xs text-muted-foreground" onClick={() => onConfirmingChange(false)}>
          戻る
        </button>
        <button
          className="min-h-11 rounded-full bg-destructive px-3 text-xs font-semibold text-destructive-foreground disabled:opacity-50"
          disabled={isPending}
          onClick={onDelete}
        >
          {isPending ? "削除中..." : "削除する"}
        </button>
      </div>
    )
  }

  return (
    <>
      {editHref && (
        <Link
          href={editHref}
          className="flex-1 flex flex-col items-center justify-center gap-1 text-muted-foreground text-[11px] font-medium hover:text-foreground transition-colors"
          onClick={() => haptic.tap()}
        >
          <Pencil className="h-[18px] w-[18px]" />
          編集
        </Link>
      )}
      <button
        onClick={() => onConfirmingChange(true)}
        disabled={isPending}
        className={`flex flex-col items-center justify-center gap-1 text-destructive text-[11px] font-medium transition-opacity hover:opacity-70 disabled:opacity-50 ${editHref ? "flex-1 border-l border-border/60" : "w-full"}`}
      >
        <Trash2 className="h-[18px] w-[18px]" />
        削除
      </button>
    </>
  )
}
