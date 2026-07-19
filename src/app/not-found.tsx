import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center p-6">
      <p className="text-5xl font-bold text-muted">404</p>
      <p className="text-xl font-semibold text-foreground">ページが見つかりません</p>
      <p className="text-sm text-muted-foreground max-w-sm">
        お探しのページは存在しないか、移動した可能性があります。
      </p>
      <Link
        href="/dashboard"
        className="mt-2 inline-flex min-h-11 items-center rounded-full border border-border px-4 py-2 text-sm transition-colors hover:bg-muted"
      >
        ダッシュボードへ戻る
      </Link>
    </div>
  )
}
