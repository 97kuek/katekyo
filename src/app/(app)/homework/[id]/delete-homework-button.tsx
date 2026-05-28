"use client"

import { useTransition, useState } from "react"
import { deleteHomework } from "./edit-actions"
import { Button } from "@/components/ui/button"

export function DeleteHomeworkButton({ homeworkId }: { homeworkId: string }) {
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">削除しますか？</span>
        <button
          onClick={() => startTransition(async () => {
            const fd = new FormData()
            fd.append("homeworkId", homeworkId)
            await deleteHomework(fd)
          })}
          disabled={isPending}
          className="text-xs font-medium text-destructive hover:text-destructive/80 disabled:opacity-50"
        >
          {isPending ? "削除中..." : "削除する"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          キャンセル
        </button>
      </div>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setConfirming(true)}
      className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
    >
      削除
    </Button>
  )
}
