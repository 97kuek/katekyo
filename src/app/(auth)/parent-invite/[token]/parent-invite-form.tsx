"use client"

import { useActionState } from "react"
import { acceptParentInvite } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { FormField } from "@/components/ui/form-field"
import { FormProgress } from "@/components/ui/form-progress"
import { PendingStatus } from "@/components/ui/pending-status"

export default function ParentInviteForm({ token, defaultEmail }: { token: string; defaultEmail?: string }) {
  const [state, action, isPending] = useActionState(acceptParentInvite, { error: "" })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">保護者アカウント登録</CardTitle>
        <CardDescription>招待を受け入れてアカウントを作成してください</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <input type="hidden" name="token" value={token} />
          <FormProgress />
          <PendingStatus pending={isPending} label="アカウントを作成しています" />
          {state.error && (
            <div className="text-sm text-foreground border border-destructive/30 bg-destructive/10 p-3 rounded-md space-y-1">
              <p>{state.error}</p>
              {state.loginRedirect && (
                <Link href={state.loginRedirect} className="underline font-medium">
                  ログインして続行 →
                </Link>
              )}
            </div>
          )}
          <FormField htmlFor="name" label="お名前" required hint="全角・半角どちらでも入力できます。姓と名の間のスペースは任意です。" example="山田 花子">
            <Input id="name" name="name" required autoComplete="name" maxLength={50} placeholder="山田 花子" />
          </FormField>
          <FormField htmlFor="email" label="メールアドレス" required hint="全角英数字は半角へ変換し、大文字は小文字として登録します。" example="parent@example.com">
            <Input id="email" name="email" type="email" required inputMode="email" autoComplete="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} defaultValue={defaultEmail} placeholder="parent@example.com" />
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
