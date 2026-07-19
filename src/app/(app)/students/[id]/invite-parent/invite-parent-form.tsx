"use client"

import { useActionState, useState } from "react"
import { createParentInvite } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { buttonVariants } from "@/components/ui/button"
import Link from "next/link"
import { FormField } from "@/components/ui/form-field"
import { FormMessage } from "@/components/ui/form-message"
import { PendingStatus } from "@/components/ui/pending-status"

export default function InviteParentForm({ studentId }: { studentId: string }) {
  const [state, action, isPending] = useActionState(createParentInvite, { error: "", token: null })
  const [copied, setCopied] = useState(false)

  // トークンはクライアント側のアクション完了後にのみ存在するため window を直接参照できる
  const origin = typeof window !== "undefined" ? window.location.origin : ""
  const inviteUrl = state.token ? `${origin}/parent-invite/${state.token}` : null

  async function copyUrl() {
    if (!inviteUrl) return
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (state.token) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-foreground border border-primary/25 bg-primary/10 p-3 rounded-md">
          招待リンクが生成されました。保護者に送付してください（7日間有効）。
        </p>
        <div>
          <Label>招待URL</Label>
          <div className="grid gap-2 mt-1 sm:flex">
            <Input value={inviteUrl ?? ""} readOnly className="sm:text-xs" />
            <Button type="button" variant="outline" onClick={copyUrl} className="shrink-0">
              {copied ? "コピー済み" : "コピー"}
            </Button>
          </div>
        </div>
        <Link href=".." className={buttonVariants({ variant: "outline", className: "w-full justify-center" })}>
          生徒一覧に戻る
        </Link>
      </div>
    )
  }

  return (
    <form action={action} className="space-y-4">
      <PendingStatus pending={isPending} label="招待リンクを生成しています" />
      <input type="hidden" name="studentId" value={studentId} />
      {state.error && <FormMessage type="error">{state.error} メールアドレスの形式を確認して、もう一度生成してください。</FormMessage>}
      <FormField htmlFor="email" label="保護者のメールアドレス" hint="未入力でも生成できます。入力する場合、全角英数字は半角へ変換し、大文字は小文字として扱います。" example="parent@example.com">
        <Input id="email" name="email" type="email" inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="parent@example.com" />
      </FormField>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "生成中..." : "招待リンクを生成"}
      </Button>
    </form>
  )
}
