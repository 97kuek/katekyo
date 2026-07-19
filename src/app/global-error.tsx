"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="ja">
      <body className="min-h-screen flex flex-col items-center justify-center gap-4 text-center p-6 font-sans">
        <p className="text-2xl font-bold">エラーが発生しました</p>
        <p className="text-sm text-muted-foreground max-w-sm">
          予期しない問題が起きました。ページを再読み込みしてください。
        </p>
        <Button type="button" variant="outline" onClick={reset}>
          再読み込み
        </Button>
      </body>
    </html>
  )
}
