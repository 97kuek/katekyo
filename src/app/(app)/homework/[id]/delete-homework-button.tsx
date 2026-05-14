"use client"

import { deleteHomework } from "./edit-actions"

export function DeleteHomeworkButton({ homeworkId }: { homeworkId: string }) {
  return (
    <form
      action={deleteHomework}
      onSubmit={(e) => {
        if (!confirm("この宿題を削除しますか？")) e.preventDefault()
      }}
    >
      <input type="hidden" name="homeworkId" value={homeworkId} />
      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
      >
        削除
      </button>
    </form>
  )
}
