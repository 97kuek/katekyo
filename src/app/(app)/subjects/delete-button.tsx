"use client"

import { useState, useTransition } from "react"
import { deleteSubject } from "./actions"
import { X } from "lucide-react"

export function DeleteSubjectButton({ id }: { id: string }) {
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">削除?</span>
        <button
          onClick={() => startTransition(async () => {
            const fd = new FormData()
            fd.append("id", id)
            await deleteSubject(fd)
          })}
          disabled={isPending}
          className="text-xs font-medium text-destructive hover:text-destructive/80 disabled:opacity-50"
        >
          {isPending ? "削除中..." : "削除"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" aria-label="キャンセル" />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs text-muted-foreground hover:text-destructive transition-colors"
    >
      削除
    </button>
  )
}
