"use client"

import { useActionState, useState } from "react"
import { createParentInviteAsStudent } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"

export default function CreateParentInvitePage() {
  const [state, action, isPending] = useActionState(createParentInviteAsStudent, { error: "", token: null })
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader backHref="/more" backLabel="その他" title="保護者を招待" description="学習状況を共有する保護者向けリンクを作成します。" />
      <Card>
        <CardHeader>
          <CardTitle>保護者を招待する</CardTitle>
          <CardDescription>
            招待リンクを生成して保護者に送ってください（7日間有効）。
            保護者は成績・授業スケジュール・請求を閲覧できます。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {state.token ? (
            <div className="space-y-4">
              <p className="text-sm text-foreground border border-primary/25 bg-primary/10 p-3 rounded-md">
                招待リンクが生成されました。保護者に送付してください。
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
              <Link href="/dashboard" className={buttonVariants({ variant: "outline", className: "w-full justify-center" })}>
                ダッシュボードに戻る
              </Link>
            </div>
          ) : (
            <form action={action} className="space-y-4">
              {state.error && (
                <p className="text-sm text-foreground border border-destructive/30 bg-destructive/10 p-3 rounded-md">{state.error}</p>
              )}
              <p className="text-sm text-muted-foreground">
                ボタンを押すと招待リンクが生成されます。LINEやメールで保護者に送ってください。
              </p>
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "生成中..." : "招待リンクを生成する"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
