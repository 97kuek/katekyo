"use client"

import { useState, useActionState } from "react"
import { resetStudentPassword } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"

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
    <div className="grid gap-2 sm:flex sm:items-center sm:gap-1.5 sm:flex-wrap">
      <form action={action} className="grid gap-2 sm:flex sm:items-center sm:gap-1.5">
        <input type="hidden" name="studentId" value={studentId} />
        <Input
          name="password"
          type="password"
          placeholder="新パスワード(8文字以上)"
          minLength={8}
          required
          className="sm:h-7 sm:w-36 sm:text-xs"
        />
        <Button
          type="submit"
          disabled={isPending}
          size="sm"
          className="h-10 sm:h-7"
        >
          {isPending ? "..." : "設定"}
        </Button>
      </form>
      {state.error && <span className="text-xs text-destructive">{state.error}</span>}
      <Button type="button" variant="outline" size="sm" className="h-10 sm:h-8" onClick={() => setOpen(false)}>
        <X className="h-4 w-4" aria-label="閉じる" />
      </Button>
    </div>
  )
}
