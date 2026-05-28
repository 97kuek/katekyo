"use client"

import { useActionState } from "react"
import { updatePassword } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function PasswordForm() {
  const [state, action, isPending] = useActionState(updatePassword, { error: "" })

  return (
    <form action={action} className="space-y-3">
      {state.error && <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">{state.error}</p>}
      {state.success && <p className="text-sm text-primary bg-primary/10 p-2 rounded">{state.success}</p>}
      <div className="space-y-1.5">
        <Label htmlFor="currentPassword">現在のパスワード</Label>
        <Input id="currentPassword" name="currentPassword" type="password" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="newPassword">新しいパスワード（8文字以上）</Label>
        <Input id="newPassword" name="newPassword" type="password" required minLength={8} />
      </div>
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "変更中..." : "パスワードを変更"}
      </Button>
    </form>
  )
}
