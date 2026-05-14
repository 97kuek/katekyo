"use client"

import { useActionState, useState, useEffect } from "react"
import { createInvite } from "./actions"
import { Button } from "@/components/ui/button"
import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GRADE_OPTIONS } from "@/lib/grades"
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
          <CardDescription>生徒の情報を入力して招待リンクを生成してください（7日間有効）</CardDescription>
        </CardHeader>
        <CardContent>
          {state.token ? (
            <div className="space-y-4">
              <p className="text-sm text-green-700 bg-green-50 p-3 rounded-md">招待リンクが生成されました。生徒に送付してください。</p>
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
                <Label htmlFor="email">生徒のメールアドレス</Label>
                <Input id="email" name="email" type="email" required placeholder="student@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grade">学年</Label>
                <select
                  id="grade"
                  name="grade"
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">学年を選択してください</option>
                  {GRADE_OPTIONS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
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
