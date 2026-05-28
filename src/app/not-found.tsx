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
        className="mt-2 px-4 py-2 border border-border rounded-full text-sm hover:bg-muted transition-colors"
      >
        ダッシュボードへ戻る
      </Link>
    </div>
  )
}
