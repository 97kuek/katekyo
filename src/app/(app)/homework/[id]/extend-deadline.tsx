"use client"

import { useState, useActionState } from "react"
import { extendDueDate } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function ExtendDeadlineButton({ homeworkId, currentDueDate }: { homeworkId: string; currentDueDate: string }) {
  const [open, setOpen] = useState(false)
  const [state, action, isPending] = useActionState(
    async (prev: { error: string; success: boolean }, formData: FormData) => {
      const result = await extendDueDate(prev, formData)
      if (result.success) setOpen(false)
      return result
    },
    { error: "", success: false }
  )

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
      <form action={action} className="grid gap-2 sm:flex sm:items-center sm:flex-wrap">
        <input type="hidden" name="id" value={homeworkId} />
        <Input
          name="dueDate"
          type="date"
          required
          defaultValue={currentDueDate}
          className="sm:w-auto"
        />
        <Button type="submit" size="sm" disabled={isPending} className="h-10 sm:h-8">
          {isPending ? "更新中..." : "更新"}
        </Button>
        <Button type="button" variant="outline" size="sm" className="h-10 sm:h-8" onClick={() => setOpen(false)}>
          キャンセル
        </Button>
      </form>
      {state.error && <p className="text-xs text-destructive">{state.error}</p>}
    </div>
  )
}
