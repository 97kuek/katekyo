"use client"

import { useActionState } from "react"
import { updateName } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FormField } from "@/components/ui/form-field"
import { FormMessage } from "@/components/ui/form-message"
import { PendingStatus } from "@/components/ui/pending-status"
import { Save } from "lucide-react"

export function NameForm({ currentName }: { currentName: string }) {
  const [state, action, isPending] = useActionState(updateName, { error: "" })

  return (
    <form action={action} className="space-y-3">
      <PendingStatus pending={isPending} label="名前を保存しています" />
      {state.error && <FormMessage type="error">{state.error} 名前を確認して、もう一度保存してください。</FormMessage>}
      {state.success && <FormMessage type="success">{state.success} ヘッダーの表示名にも反映されます。</FormMessage>}
      <FormField htmlFor="name" label="名前" required hint="全角・半角どちらでも入力できます。50文字以内です。" example="山田 花子">
        <Input id="name" name="name" required autoComplete="name" defaultValue={currentName} maxLength={50} />
      </FormField>
      <Button type="submit" size="sm" disabled={isPending}>
        <Save aria-hidden />
        {isPending ? "保存中..." : "保存"}
      </Button>
    </form>
  )
}
