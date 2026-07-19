"use client"

import { useActionState, useTransition, useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  generateLinkToken,
  unlinkLine,
  saveMeetLink,
  deleteParentAccount,
  linkGoogleAccount,
  unlinkGoogleAccount,
} from "./actions"
import { toast } from "sonner"

export function GoogleAuthSettings({ isLinked }: { isLinked: boolean }) {
  const [isPending, startTransition] = useTransition()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Google ログイン</CardTitle>
        <CardDescription>
          Googleの本人確認を、このアプリのプロフィールへ安全に連携します
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className={`h-2 w-2 rounded-full ${isLinked ? "bg-primary" : "bg-muted-foreground"}`} />
          {isLinked ? "連携済み" : "未連携"}
        </div>
        <p className="text-sm text-muted-foreground">
          メールアドレスの一致だけでは連携しません。ログイン中にGoogle側でも本人確認します。
        </p>
        {isLinked ? (
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => startTransition(async () => {
              await unlinkGoogleAccount()
            })}
          >
            {isPending ? "解除中..." : "連携を解除する"}
          </Button>
        ) : (
          <form action={linkGoogleAccount}>
            <Button type="submit" size="sm">Google アカウントを連携する</Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}

export function DeleteParentAccountButton() {
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      await deleteParentAccount()
    })
  }

  if (!confirming) {
    return (
      <Button variant="destructive" size="sm" onClick={() => setConfirming(true)}>
        アカウントを削除する
      </Button>
    )
  }

  return (
    <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
      <p className="text-sm font-medium text-destructive">本当に削除しますか？この操作は取り消せません。</p>
      <div className="flex gap-2">
        <Button variant="destructive" size="sm" disabled={isPending} onClick={handleDelete}>
          {isPending ? "削除中..." : "削除する"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setConfirming(false)}>キャンセル</Button>
      </div>
    </div>
  )
}

export function MeetLinkSettings({ currentMeetLink }: { currentMeetLink: string | null }) {
  const [state, action, isPending] = useActionState(saveMeetLink, {})
  const [isEditing, setIsEditing] = useState(!currentMeetLink)
  const [displayedLink, setDisplayedLink] = useState(currentMeetLink)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (state.success && inputRef.current) {
      setDisplayedLink(inputRef.current.value || null)
      setIsEditing(false)
      toast.success("Meet リンクを保存しました")
    }
  }, [state.success])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Google Meet リンク</CardTitle>
        <CardDescription>
          オンライン授業の10分前に生徒のLINEへ自動送信されます
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {displayedLink && !isEditing ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-primary font-medium">
              <span className="h-2 w-2 rounded-full bg-primary inline-block" />
              登録済み
            </div>
            <div className="flex items-center gap-2 rounded-lg border bg-muted px-3 py-2">
              <span className="flex-1 text-sm truncate text-muted-foreground">{displayedLink}</span>
              <a
                href={displayedLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 shrink-0 items-center px-1 text-xs font-medium text-primary underline"
              >
                開く
              </a>
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              変更する
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/50 p-3 space-y-2 text-sm">
              <p className="font-medium text-xs text-muted-foreground uppercase tracking-wide">Meet リンクの取得方法</p>
              <ol className="space-y-1.5 text-sm list-decimal list-inside text-muted-foreground">
                <li>
                  <a href="https://meet.google.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    meet.google.com
                  </a>
                  {" "}を開く
                </li>
                <li>「新しい会議」→「後で開始する会議を作成」をクリック</li>
                <li>表示された URL をコピーしてここに貼り付ける</li>
              </ol>
              <p className="text-xs text-muted-foreground pt-1">
                ※ このリンクは毎回同じURLを使い回せます
              </p>
            </div>
            <form action={action} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="meetLink">Meet URL</Label>
                <Input
                  ref={inputRef}
                  id="meetLink"
                  name="meetLink"
                  type="url"
                  placeholder="https://meet.google.com/xxx-yyyy-zzz"
                  defaultValue={displayedLink ?? ""}
                />
              </div>
              {state.error && <p className="text-sm text-destructive">{state.error}</p>}
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={isPending}>
                  {isPending ? "保存中..." : "保存する"}
                </Button>
                {displayedLink && (
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                    キャンセル
                  </Button>
                )}
              </div>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function LineSettings({ isLinked }: { isLinked: boolean }) {
  const router = useRouter()
  const [linked, setLinked] = useState(isLinked)
  const [tokenState, generateAction, isGenerating] = useActionState(generateLinkToken, {})
  const [isUnlinking, startUnlink] = useTransition()

  if (linked) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">LINE通知</CardTitle>
          <CardDescription>LINEアカウントと連携中です</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-primary font-medium">
            <span className="h-2 w-2 rounded-full bg-primary inline-block" />
            連携済み
          </div>
          <p className="text-sm text-muted-foreground">
            宿題の提出・承認・差し戻し時にLINE通知が届きます。
          </p>
          <Button
            variant="outline"
            size="sm"
            disabled={isUnlinking}
            onClick={() => startUnlink(async () => {
              const result = await unlinkLine()
              if (result.error) {
                toast.error(result.error)
                return
              }
              setLinked(false)
              toast.success("LINE連携を解除しました")
              router.refresh()
            })}
          >
            {isUnlinking ? "解除中..." : "連携を解除する"}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">LINE通知</CardTitle>
        <CardDescription>LINEと連携して宿題の通知を受け取りましょう</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {tokenState.token ? (
          <div className="space-y-3">
            <p className="text-sm">
              <span className="font-medium">STEP 1.</span>{" "}
              <a
                href="https://line.me/R/ti/p/%40176cvrwc"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                katekyoのLINE公式アカウントを友だち追加
              </a>
            </p>
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://qr-official.line.me/gs/M_176cvrwc_GW.png?oat_content=qr"
                alt="LINE QRコード"
                width={160}
                height={160}
                className="rounded-lg border"
              />
            </div>
            <p className="text-sm">
              <span className="font-medium">STEP 2.</span>{" "}
              LINEのトーク画面に下のコードを送信してください（10分間有効）
            </p>
            <div className="flex items-center justify-center rounded-lg border bg-muted py-4">
              <span className="text-3xl font-mono font-bold tracking-widest">
                {tokenState.token}
              </span>
            </div>
            <form action={generateAction}>
              <Button type="submit" variant="ghost" size="sm" disabled={isGenerating}>
                コードを再発行する
              </Button>
            </form>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              宿題の提出・承認・差し戻し時にLINE通知が届きます。
            </p>
            {tokenState.error && (
              <p className="text-sm text-destructive">{tokenState.error}</p>
            )}
            <form action={generateAction}>
              <Button type="submit" disabled={isGenerating}>
                LINE連携を開始する
              </Button>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
