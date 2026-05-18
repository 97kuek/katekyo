"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function AppError({
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
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <p className="text-2xl font-bold text-foreground">エラーが発生しました</p>
      <p className="text-sm text-muted-foreground max-w-sm">
        ページの読み込み中に問題が起きました。しばらくしてから再試行してください。
      </p>
      <Button onClick={reset} variant="outline" size="sm">
        もう一度試す
      </Button>
    </div>
  )
}
