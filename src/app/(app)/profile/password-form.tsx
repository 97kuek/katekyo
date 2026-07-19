"use client"

import { useActionState } from "react"
import { updatePassword } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FormField } from "@/components/ui/form-field"
import { FormProgress } from "@/components/ui/form-progress"
import { FormMessage } from "@/components/ui/form-message"
import { PendingStatus } from "@/components/ui/pending-status"
import { KeyRound } from "lucide-react"

export function PasswordForm() {
  const [state, action, isPending] = useActionState(updatePassword, { error: "" })

  return (
    <form action={action} className="space-y-3">
      <PendingStatus pending={isPending} label="パスワードを変更しています" />
      {state.error && <FormMessage type="error">{state.error} 現在のパスワードと文字数を確認してください。</FormMessage>}
      {state.success && <FormMessage type="success">{state.success} 次回ログインから新しいパスワードを使用してください。</FormMessage>}
      <FormProgress />
      <FormField htmlFor="currentPassword" label="現在のパスワード" required hint="英字の大文字・小文字、全角・半角を登録時と同じように入力します。">
        <Input id="currentPassword" name="currentPassword" type="password" required autoComplete="current-password" />
      </FormField>
      <FormField htmlFor="newPassword" label="新しいパスワード" required hint="8文字以上。英字の大文字・小文字は区別され、全角文字も使用できます。">
        <Input id="newPassword" name="newPassword" type="password" required minLength={8} autoComplete="new-password" />
      </FormField>
      <Button type="submit" size="sm" disabled={isPending}>
        <KeyRound aria-hidden />
        {isPending ? "変更中..." : "パスワードを変更"}
      </Button>
    </form>
  )
}
