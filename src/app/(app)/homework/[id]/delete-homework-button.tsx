"use client"

import { useTransition, useState } from "react"
import { deleteHomework } from "./edit-actions"

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
    <button
      onClick={() => setConfirming(true)}
      className="inline-flex items-center justify-center rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
    >
      削除
    </button>
  )
}
