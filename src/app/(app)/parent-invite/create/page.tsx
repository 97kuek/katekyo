"use client"

import { useActionState } from "react"
import { createParentInviteAsStudent } from "./actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { PendingStatus } from "@/components/ui/pending-status"
import { InviteLinkResult } from "@/components/invitations/invite-link-result"
import { Link2 } from "lucide-react"

export default function CreateParentInvitePage() {
  const [state, action, isPending] = useActionState(createParentInviteAsStudent, { error: "", token: null })

  // トークンはクライアント側のアクション完了後にのみ存在するため window を直接参照できる
  const origin = typeof window !== "undefined" ? window.location.origin : ""
  const inviteUrl = state.token ? `${origin}/parent-invite/${state.token}` : null

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
            <InviteLinkResult
              url={inviteUrl ?? ""}
              message="招待リンクが生成されました。保護者に送付してください。"
              nextHref="/dashboard"
              nextLabel="ホームに戻る"
            />
          ) : (
            <form action={action} className="space-y-4">
              <PendingStatus pending={isPending} label="招待リンクを生成しています" />
              {state.error && (
                <p className="text-sm text-foreground border border-destructive/30 bg-destructive/10 p-3 rounded-md">{state.error}</p>
              )}
              <p className="text-sm text-muted-foreground">
                ボタンを押すと招待リンクが生成されます。LINEやメールで保護者に送ってください。
              </p>
              <Button type="submit" className="w-full" disabled={isPending}>
                <Link2 aria-hidden />
                {isPending ? "生成中..." : "招待リンクを生成する"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
