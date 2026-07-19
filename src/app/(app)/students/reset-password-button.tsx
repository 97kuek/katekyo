"use client"

import { useState, useActionState } from "react"
import { resetStudentPassword } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { KeyRound, Save, X } from "lucide-react"
import { toast } from "sonner"
import { PendingStatus } from "@/components/ui/pending-status"
import { FormField } from "@/components/ui/form-field"
import { FormMessage } from "@/components/ui/form-message"

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
        <KeyRound aria-hidden />
        変更
      </Button>
    )
  }

  return (
    <div className="grid gap-2 sm:flex sm:items-center sm:gap-1.5 sm:flex-wrap">
      <form action={action} className="grid gap-2 sm:flex sm:items-center sm:gap-1.5">
        <PendingStatus pending={isPending} label="パスワードを変更しています" />
        <input type="hidden" name="studentId" value={studentId} />
        <FormField htmlFor={`password-${studentId}`} label="新しいパスワード" required hint="8文字以上。大文字・小文字、全角・半角を区別します。" className="sm:w-48">
          <Input
            id={`password-${studentId}`}
            name="password"
            type="password"
            placeholder="8文字以上"
            minLength={8}
            required
            autoComplete="new-password"
            className="sm:h-8 sm:text-xs"
          />
        </FormField>
        <Button
          type="submit"
          disabled={isPending}
          size="sm"
          className="h-10 sm:h-7"
        >
          <Save aria-hidden />
          {isPending ? "..." : "設定"}
        </Button>
      </form>
      {state.error && <FormMessage type="error">{state.error}</FormMessage>}
      <Button type="button" variant="outline" size="sm" className="h-10 sm:h-8" onClick={() => setOpen(false)}>
        <X aria-hidden />
        閉じる
      </Button>
    </div>
  )
}
