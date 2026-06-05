"use client"

import { useTransition } from "react"
import Link from "next/link"
import { deleteGradeRecord } from "./[id]/edit-actions"
import { haptic } from "@/lib/haptic"

export function GradeSwipeActions({ gradeId }: { gradeId: string }) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    haptic.error()
    const fd = new FormData()
    fd.append("gradeId", gradeId)
    startTransition(async () => { await deleteGradeRecord(fd) })
  }

  return (
    <>
      <Link
        href={`/grades/${gradeId}/edit`}
        className="flex-1 flex items-center justify-center bg-primary/90 text-primary-foreground text-sm font-medium hover:bg-primary transition-colors"
        onClick={() => haptic.tap()}
      >
        編集
      </Link>
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="flex-1 flex items-center justify-center bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50"
      >
        {isPending ? "…" : "削除"}
      </button>
    </>
  )
}
