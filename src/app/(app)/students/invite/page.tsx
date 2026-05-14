"use client"

import { useActionState, useState, useEffect } from "react"
import { createInvite } from "./actions"
import { Button } from "@/components/ui/button"
import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function InvitePage() {
  const [state, action, isPending] = useActionState(createInvite, { error: "", token: null })
  const [copied, setCopied] = useState(false)
  const [origin, setOrigin] = useState("")

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const inviteUrl = state.token ? `${origin}/invite/${state.token}` : null

  async function copyUrl() {
    if (!inviteUrl) return
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link href="/students" className="text-sm text-muted-foreground hover:underline">
          ← 生徒一覧に戻る
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>生徒を招待する</CardTitle>
          <CardDescription>招待リンクを生成して生徒に送付してください（7日間有効）</CardDescription>
        </CardHeader>
        <CardContent>
          {state.token ? (
            <div className="space-y-4">
              <p className="text-sm text-green-700 bg-green-50 p-3 rounded-md">招待リンクが生成されました</p>
              <div>
                <Label>招待URL</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={inviteUrl ?? ""} readOnly className="text-xs" />
                  <Button type="button" variant="outline" onClick={copyUrl} className="shrink-0">
                    {copied ? "コピー済み" : "コピー"}
                  </Button>
                </div>
              </div>
              <Link href="/students/invite" className={buttonVariants({ variant: "outline", className: "w-full justify-center" })}>
                別の招待を作成
              </Link>
            </div>
          ) : (
            <form action={action} className="space-y-4">
              {state.error && (
                <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{state.error}</p>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">生徒の名前</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grade">学年</Label>
                <Input id="grade" name="grade" placeholder="例: 中学3年" required />
              </div>
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "生成中..." : "招待リンクを生成"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
