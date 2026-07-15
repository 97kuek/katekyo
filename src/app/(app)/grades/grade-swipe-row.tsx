"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Pencil, Trash2 } from "lucide-react"
import { deleteGradeRecord } from "./[id]/actions"
import { haptic } from "@/lib/haptic"
import { SwipeableRow } from "@/components/ui/swipeable-row"

export function GradeSwipeRow({ gradeId, children }: { gradeId: string; children: React.ReactNode }) {
  const [isPending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)

  function handleDelete() {
    haptic.error()
    const fd = new FormData()
    fd.append("gradeId", gradeId)
    startTransition(async () => {
      await deleteGradeRecord(fd)
    })
  }

  return (
    <SwipeableRow
      actionWidth={176}
      actions={
        confirming ? (
          <div className="flex w-full items-center justify-center gap-2 bg-destructive/10 px-2">
            <button className="min-h-11 px-2 text-xs text-muted-foreground" onClick={() => setConfirming(false)}>戻る</button>
            <button className="min-h-11 rounded-full bg-destructive px-3 text-xs font-semibold text-destructive-foreground disabled:opacity-50" disabled={isPending} onClick={handleDelete}>
              {isPending ? "削除中..." : "削除する"}
            </button>
          </div>
        ) : <>
          <Link
            href={`/grades/${gradeId}/edit`}
            className="flex-1 flex flex-col items-center justify-center gap-1 text-muted-foreground text-[11px] font-medium hover:text-foreground transition-colors"
            onClick={() => haptic.tap()}
          >
            <Pencil className="h-[18px] w-[18px]" />
            編集
          </Link>
          <button
            onClick={() => setConfirming(true)}
            disabled={isPending}
            className="flex-1 flex flex-col items-center justify-center gap-1 border-l border-border/60 text-destructive text-[11px] font-medium transition-opacity hover:opacity-70 disabled:opacity-50"
          >
            <Trash2 className="h-[18px] w-[18px]" />
            削除
          </button>
        </>
      }
    >
      {children}
    </SwipeableRow>
  )
}
