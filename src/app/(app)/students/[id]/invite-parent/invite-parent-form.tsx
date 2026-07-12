"use client"

import { useActionState, useState } from "react"
import { createParentInvite } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { buttonVariants } from "@/components/ui/button"
import Link from "next/link"

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
        <p className="text-sm text-primary bg-primary/10 p-3 rounded-md">
          招待リンクが生成されました。保護者に送付してください（7日間有効）。
        </p>
        <div>
          <Label>招待URL</Label>
          <div className="flex gap-2 mt-1">
            <Input value={inviteUrl ?? ""} readOnly className="text-xs" />
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
      <input type="hidden" name="studentId" value={studentId} />
      {state.error && (
        <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{state.error}</p>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">保護者のメールアドレス <span className="text-xs text-muted-foreground font-normal">（任意）</span></Label>
        <Input id="email" name="email" type="email" placeholder="parent@example.com" />
        <p className="text-xs text-muted-foreground">入力しておくと、保護者がそのアドレスで登録しやすくなります</p>
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "生成中..." : "招待リンクを生成"}
      </Button>
    </form>
  )
}
