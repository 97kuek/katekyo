"use client"

import { useState, useActionState } from "react"
import { resetStudentPassword } from "./actions"
import { Button } from "@/components/ui/button"

export function ResetPasswordButton({ studentId }: { studentId: string }) {
  const [open, setOpen] = useState(false)
  const [state, action, isPending] = useActionState(
    async (prev: { error: string; success: boolean }, formData: FormData) => {
      const result = await resetStudentPassword(prev, formData)
      if (result.success) setOpen(false)
      return result
    },
    { error: "", success: false }
  )

  if (!open) {
    return (
      <Button variant="ghost" size="xs" onClick={() => setOpen(true)}>
        PW変更
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <form action={action} className="flex items-center gap-1.5">
        <input type="hidden" name="studentId" value={studentId} />
        <input
          name="password"
          type="password"
          placeholder="新パスワード(8文字以上)"
          minLength={8}
          required
          className="h-7 w-36 rounded border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <button
          type="submit"
          disabled={isPending}
          className="text-xs font-medium text-primary hover:text-primary/80 disabled:opacity-50"
        >
          {isPending ? "..." : "設定"}
        </button>
      </form>
      {state.error && <span className="text-xs text-destructive">{state.error}</span>}
      <button onClick={() => setOpen(false)} className="text-xs text-muted-foreground hover:text-foreground">
        ✕
      </button>
    </div>
  )
}
