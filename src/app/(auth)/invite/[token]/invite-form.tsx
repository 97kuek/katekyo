"use client"

import { useActionState } from "react"
import { acceptInvite } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type Props = {
  token: string
  name: string
}

export default function InviteForm({ token, name }: Props) {
  const [state, action, isPending] = useActionState(acceptInvite, { error: "" })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">アカウント登録</CardTitle>
        <CardDescription>{name} さんの招待を受け入れてアカウントを作成してください</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <input type="hidden" name="token" value={token} />
          {state.error && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{state.error}</p>
          )}
          <div className="space-y-2">
            <Label>名前</Label>
            <Input value={name} disabled className="bg-gray-50" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input id="email" name="email" type="email" required />
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
