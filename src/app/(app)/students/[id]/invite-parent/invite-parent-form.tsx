"use client"

import { useActionState } from "react"
import { createParentInvite } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FormField } from "@/components/ui/form-field"
import { FormMessage } from "@/components/ui/form-message"
import { PendingStatus } from "@/components/ui/pending-status"
import { InviteLinkResult } from "@/components/invitations/invite-link-result"
import { Link2 } from "lucide-react"

export default function InviteParentForm({ studentId }: { studentId: string }) {
  const [state, action, isPending] = useActionState(createParentInvite, { error: "", token: null })

  // トークンはクライアント側のアクション完了後にのみ存在するため window を直接参照できる
  const origin = typeof window !== "undefined" ? window.location.origin : ""
  const inviteUrl = state.token ? `${origin}/parent-invite/${state.token}` : null

  if (state.token) {
    return (
      <InviteLinkResult
        url={inviteUrl ?? ""}
        message="招待リンクが生成されました。保護者に送付してください（7日間有効）。"
        nextHref=".."
        nextLabel="生徒一覧に戻る"
      />
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
        <Link2 aria-hidden />
        {isPending ? "生成中..." : "招待リンクを生成"}
      </Button>
    </form>
  )
}
