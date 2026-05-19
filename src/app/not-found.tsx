import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center p-6">
      <p className="text-5xl font-bold text-gray-200">404</p>
      <p className="text-xl font-semibold text-gray-800">ページが見つかりません</p>
      <p className="text-sm text-gray-500 max-w-sm">
        お探しのページは存在しないか、移動した可能性があります。
      </p>
      <Link
        href="/dashboard"
        className="mt-2 px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors"
      >
        ダッシュボードへ戻る
      </Link>
    </div>
  )
}
