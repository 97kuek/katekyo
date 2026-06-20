"use client"

import { useTransition } from "react"
import Link from "next/link"
import { Pencil, Trash2 } from "lucide-react"
import { deleteGradeRecord } from "./[id]/actions"
import { haptic } from "@/lib/haptic"
import { SwipeableRow } from "@/components/ui/swipeable-row"

export function GradeSwipeRow({ gradeId, children }: { gradeId: string; children: React.ReactNode }) {
  const [isPending, startTransition] = useTransition()

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
      onFullSwipe={handleDelete}
      actions={
        <>
          <Link
            href={`/grades/${gradeId}/edit`}
            className="flex-1 flex flex-col items-center justify-center gap-1 text-muted-foreground text-[11px] font-medium hover:text-foreground transition-colors"
            onClick={() => haptic.tap()}
          >
            <Pencil className="h-[18px] w-[18px]" />
            編集
          </Link>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="flex-1 flex flex-col items-center justify-center gap-1 border-l border-border/60 text-destructive text-[11px] font-medium transition-opacity hover:opacity-70 disabled:opacity-50"
          >
            <Trash2 className="h-[18px] w-[18px]" />
            {isPending ? "…" : "削除"}
          </button>
        </>
      }
    >
      {children}
    </SwipeableRow>
  )
}
