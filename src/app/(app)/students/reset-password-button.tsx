"use client"

import { useState, useActionState } from "react"
import { resetStudentPassword } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"
import { toast } from "sonner"
import { PendingStatus } from "@/components/ui/pending-status"

export function ResetPasswordButton({ studentId }: { studentId: string }) {
  const [open, setOpen] = useState(false)
  const [state, action, isPending] = useActionState(
    async (prev: { error: string; success: boolean }, formData: FormData) => {
      const result = await resetStudentPassword(prev, formData)
      if (result.success) {
        setOpen(false)
        toast.success("パスワードを変更しました。次回ログインから新しいパスワードを使用します")
      }
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
        <PendingStatus pending={isPending} label="パスワードを変更しています" />
        <input type="hidden" name="studentId" value={studentId} />
        <label htmlFor={`password-${studentId}`} className="grid gap-1 text-xs font-medium">
          新しいパスワード（必須）
          <Input
            id={`password-${studentId}`}
            name="password"
            type="password"
            aria-describedby={`password-help-${studentId}`}
            placeholder="8文字以上"
            minLength={8}
            required
            autoComplete="new-password"
            className="sm:h-7 sm:w-40 sm:text-xs"
          />
          <span id={`password-help-${studentId}`} className="font-normal text-muted-foreground">大文字・小文字を区別します</span>
        </label>
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
