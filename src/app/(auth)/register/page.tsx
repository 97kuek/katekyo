"use client"

import { useActionState } from "react"
import { registerTeacher } from "./actions"
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
import { FormProgress } from "@/components/ui/form-progress"
import { FormMessage } from "@/components/ui/form-message"
import { PendingStatus } from "@/components/ui/pending-status"

export default function RegisterPage() {
  const [state, action, isPending] = useActionState(registerTeacher, { error: "" })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">先生として登録</CardTitle>
        <CardDescription>新しいアカウントを作成してください</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          {state.error && <FormMessage type="error">{state.error} 入力内容を確認して、もう一度お試しください。</FormMessage>}
          <FormProgress />
          <PendingStatus pending={isPending} label="アカウントを登録しています" />
          <FormField htmlFor="name" label="名前" required hint="全角・半角どちらでも入力できます。姓と名の間のスペースは任意です。" example="山田 花子">
            <Input id="name" name="name" type="text" required autoComplete="name" maxLength={50} placeholder="山田 花子" />
          </FormField>
          <FormField htmlFor="email" label="メールアドレス" required hint="全角英数字は半角へ変換し、大文字は小文字として登録します。ハイフンはメールアドレスに含まれる場合のみ入力してください。" example="teacher@example.com">
            <Input id="email" name="email" type="email" required inputMode="email" autoComplete="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="teacher@example.com" />
          </FormField>
          <FormField htmlFor="password" label="パスワード" required hint="8文字以上。英字の大文字・小文字は区別され、全角文字も使用できます。" example="Katekyo2026">
            <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
          </FormField>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "登録中..." : "登録する"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          すでにアカウントをお持ちの方は{" "}
          <Link href="/login" className="inline-flex min-h-11 items-center underline underline-offset-4">
            ログイン
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
