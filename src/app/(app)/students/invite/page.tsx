"use client"

import { useActionState, useState } from "react"
import { createInvite } from "./actions"
import { Button } from "@/components/ui/button"
import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GRADE_OPTIONS } from "@/lib/grades"
import Link from "next/link"

export default function InvitePage() {
  const [state, action, isPending] = useActionState(createInvite, { error: "", token: null })
  const [copied, setCopied] = useState(false)

  // トークンはクライアント側のアクション完了後にのみ存在するため window を直接参照できる
  const origin = typeof window !== "undefined" ? window.location.origin : ""
  const inviteUrl = state.token ? `${origin}/invite/${state.token}` : null

  async function copyUrl() {
    if (!inviteUrl) return
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/students" className="text-sm text-muted-foreground hover:underline">
          ← 生徒一覧に戻る
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>生徒を招待する</CardTitle>
          <CardDescription>生徒の情報を入力して招待リンクを生成し、生徒本人に送付してください（7日間有効）</CardDescription>
        </CardHeader>
        <CardContent>
          {state.token ? (
            <div className="space-y-4">
              <p className="text-sm text-foreground border border-primary/25 bg-primary/10 p-3 rounded-md">招待リンクが生成されました。生徒に送付してください。</p>
              <div>
                <Label>招待URL</Label>
                <div className="grid gap-2 mt-1 sm:flex">
                  <Input value={inviteUrl ?? ""} readOnly className="sm:text-xs" />
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
                <p className="text-sm text-foreground border border-destructive/30 bg-destructive/10 p-3 rounded-md">{state.error}</p>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">生徒の名前</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grade">学年</Label>
                <Select id="grade" name="grade" required>
                  <option value="">学年を選択してください</option>
                  {GRADE_OPTIONS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </Select>
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
