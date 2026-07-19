"use client"

import { useActionState } from "react"
import { acceptParentInvite } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

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
          <div className="space-y-2">
            <Label htmlFor="name">お名前</Label>
            <Input id="name" name="name" required placeholder="山田 花子" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input id="email" name="email" type="email" required defaultValue={defaultEmail} placeholder="parent@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">パスワード（8文字以上）</Label>
            <Input id="password" name="password" type="password" required minLength={8} />
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "登録中..." : "アカウントを作成する"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
