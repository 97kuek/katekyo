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
            className="flex-1 flex flex-col items-center justify-center gap-1 bg-primary/15 text-primary text-xs font-medium hover:bg-primary/25 transition-colors"
            onClick={() => haptic.tap()}
          >
            <Pencil className="h-4 w-4" />
            編集
          </Link>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="flex-1 flex flex-col items-center justify-center gap-1 bg-destructive/15 text-destructive text-xs font-medium hover:bg-destructive/25 transition-colors disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            {isPending ? "…" : "削除"}
          </button>
        </>
      }
    >
      {children}
    </SwipeableRow>
  )
}
