"use client"

import { useEffect } from "react"

export default function RootError({
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
        <button
          onClick={reset}
          className="px-4 py-2 border border-border rounded-full text-sm hover:bg-muted"
        >
          再読み込み
        </button>
      </body>
    </html>
  )
}
