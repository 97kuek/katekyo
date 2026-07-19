"use client"

import { useActionState } from "react"
import { acceptInvite } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FormField } from "@/components/ui/form-field"
import { FormProgress } from "@/components/ui/form-progress"
import { FormMessage } from "@/components/ui/form-message"
import { PendingStatus } from "@/components/ui/pending-status"

type Props = {
  token: string
  name: string
  grade: string
}

export default function InviteForm({ token, name, grade }: Props) {
  const [state, action, isPending] = useActionState(acceptInvite, { error: "" })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">アカウント登録</CardTitle>
        <CardDescription>招待を受け入れてアカウントを作成してください</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <input type="hidden" name="token" value={token} />
          {state.error && <FormMessage type="error">{state.error} 入力内容を確認して、もう一度お試しください。</FormMessage>}
          <FormProgress />
          <PendingStatus pending={isPending} label="アカウントを作成しています" />
          <div className="space-y-2">
            <Label>名前</Label>
            <Input value={name} disabled className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label>学年</Label>
            <Input value={grade} disabled className="bg-muted" />
          </div>
          <FormField htmlFor="email" label="メールアドレス" required hint="全角英数字は半角へ変換し、大文字は小文字として登録します。" example="student@example.com">
            <Input id="email" name="email" type="email" required inputMode="email" autoComplete="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="student@example.com" />
          </FormField>
          <FormField htmlFor="password" label="パスワード" required hint="8文字以上。英字の大文字・小文字は区別され、全角文字も使用できます。">
            <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
          </FormField>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "登録中..." : "アカウントを作成する"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
