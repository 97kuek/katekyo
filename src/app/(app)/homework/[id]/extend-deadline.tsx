"use client"

import { useState, useActionState, useEffect } from "react"
import { extendDueDate } from "./edit-actions"
import { Button } from "@/components/ui/button"

export function ExtendDeadlineButton({ homeworkId, currentDueDate }: { homeworkId: string; currentDueDate: string }) {
  const [open, setOpen] = useState(false)
  const [state, action, isPending] = useActionState(extendDueDate, { error: "", success: false })

  useEffect(() => {
    if (state.success) setOpen(false)
  }, [state.success])

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        期限を延長
      </Button>
    )
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
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
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "更新中..." : "更新"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
          キャンセル
        </Button>
      </form>
      {state.error && <p className="text-xs text-destructive">{state.error}</p>}
    </div>
  )
}
