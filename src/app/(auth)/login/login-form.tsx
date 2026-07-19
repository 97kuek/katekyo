"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import Link from "next/link"
import { FormField } from "@/components/ui/form-field"
import { FormMessage } from "@/components/ui/form-message"
import { normalizeEmailInput } from "@/lib/input-normalization"
import { PendingStatus } from "@/components/ui/pending-status"

export default function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState("")
  const [isPending, setIsPending] = useState(false)

  const registered = searchParams.get("registered")
  const invited = searchParams.get("invited")
  const authError = searchParams.get("error")

  const googleError = authError === "GoogleNotLinked"
    ? "このGoogleアカウントは未連携です。先にメールアドレスとパスワードでログインし、設定から連携してください。"
    : authError === "GoogleEmailNotVerified"
      ? "確認済みメールアドレスを持つGoogleアカウントを使用してください。"
      : authError
        ? "Googleログインを完了できませんでした。"
        : ""

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsPending(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const result = await signIn("credentials", {
      email: normalizeEmailInput(formData.get("email")),
      password: formData.get("password"),
      redirect: false,
    })

    if (result?.error) {
      setError("メールアドレスまたはパスワードが正しくありません")
      setIsPending(false)
    } else {
      const next = searchParams.get("next")
      const dest = next && next.startsWith("/") ? next : "/dashboard"
      router.push(dest)
      router.refresh()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">ログイン</CardTitle>
        <CardDescription>アカウントにログインしてください</CardDescription>
      </CardHeader>
      <CardContent>
        {googleError && (
          <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-foreground">
            {googleError}
          </p>
        )}
        {registered && (
          <p className="mb-4 text-sm text-foreground border border-primary/25 bg-primary/10 p-3 rounded-lg">
            登録が完了しました。ログインしてください。
          </p>
        )}
        {invited && (
          <p className="mb-4 text-sm text-foreground border border-primary/25 bg-primary/10 p-3 rounded-lg">
            アカウントが作成されました。ログインしてください。
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <FormMessage type="error">{error}。入力形式を確認し、解決しない場合は登録したメールアドレスを先生または管理者へ確認してください。</FormMessage>}
          <PendingStatus pending={isPending} label="ログインしています" />
          <FormField htmlFor="email" label="メールアドレス" required hint="全角英数字は半角へ変換し、大文字は小文字として扱います。" example="name@example.com">
            <Input id="email" name="email" type="email" required inputMode="email" autoComplete="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="name@example.com" />
          </FormField>
          <FormField htmlFor="password" label="パスワード" required hint="8文字以上。英字の大文字・小文字は区別されます。">
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </FormField>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "ログイン中..." : "ログイン"}
          </Button>
        </form>
        {googleEnabled && (
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />または<span className="h-px flex-1 bg-border" />
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            >
              Googleでログイン
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          先生として新規登録は{" "}
          <Link href="/register" className="inline-flex min-h-11 items-center underline underline-offset-4">
            こちら
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
