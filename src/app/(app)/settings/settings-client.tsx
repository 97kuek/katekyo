"use client"

import { useActionState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { generateLinkToken, unlinkLine } from "./actions"

export function LineSettings({ isLinked }: { isLinked: boolean }) {
  const [tokenState, generateAction, isGenerating] = useActionState(generateLinkToken, {})
  const [isUnlinking, startUnlink] = useTransition()

  if (isLinked) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">LINE通知</CardTitle>
          <CardDescription>LINEアカウントと連携中です</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-green-700 font-medium">
            <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />
            連携済み
          </div>
          <p className="text-sm text-muted-foreground">
            宿題の提出・承認・差し戻し時にLINE通知が届きます。
          </p>
          <Button
            variant="outline"
            size="sm"
            disabled={isUnlinking}
            onClick={() => startUnlink(async () => { await unlinkLine(); location.reload() })}
          >
            連携を解除する
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
            <div className="flex flex-col items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://qr-official.line.me/gs/M_176cvrwc_GW.png?oat_content=qr"
                alt="LINE QRコード"
                width={160}
                height={160}
                className="rounded-lg border"
              />
              <a href="https://lin.ee/nflz4R4" target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://scdn.line-apps.com/n/line_add_friends/btn/ja.png"
                  alt="友だち追加"
                  height={36}
                  className="border-0"
                />
              </a>
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
