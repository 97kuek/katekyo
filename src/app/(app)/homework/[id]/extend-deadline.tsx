"use client"

import { useState, useActionState, useEffect } from "react"
import { extendDueDate } from "./edit-actions"

export function ExtendDeadlineButton({ homeworkId, currentDueDate }: { homeworkId: string; currentDueDate: string }) {
  const [open, setOpen] = useState(false)
  const [state, action, isPending] = useActionState(extendDueDate, { error: "", success: false })

  useEffect(() => {
    if (state.success) setOpen(false)
  }, [state.success])

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-muted-foreground hover:text-foreground border border-input rounded-md px-3 py-1.5 hover:bg-gray-50 transition-colors"
      >
        期限を延長
      </button>
    )
  }

  return (
    <div className="rounded-lg border bg-white p-4 space-y-3">
      <p className="text-sm font-medium">期限を変更</p>
      <form action={action} className="flex items-center gap-2 flex-wrap">
        <input type="hidden" name="id" value={homeworkId} />
        <input
          name="dueDate"
          type="date"
          required
          defaultValue={currentDueDate}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          type="submit"
          disabled={isPending}
          className="h-9 rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? "更新中..." : "更新"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="h-9 rounded-md border border-input px-4 text-sm hover:bg-gray-50"
        >
          キャンセル
        </button>
      </form>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
    </div>
  )
}
