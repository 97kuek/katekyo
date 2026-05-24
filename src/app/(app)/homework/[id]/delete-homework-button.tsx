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
        <span className="text-xs text-gray-600">削除しますか？</span>
        <button
          onClick={() => startTransition(async () => {
            const fd = new FormData()
            fd.append("homeworkId", homeworkId)
            await deleteHomework(fd)
          })}
          disabled={isPending}
          className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
        >
          {isPending ? "削除中..." : "削除する"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-gray-400 hover:text-gray-600"
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
      className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-600"
    >
      削除
    </Button>
  )
}
