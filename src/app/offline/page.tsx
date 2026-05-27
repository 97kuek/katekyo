export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center p-6">
      <p className="text-5xl">📵</p>
      <p className="text-xl font-semibold text-gray-800">オフラインです</p>
      <p className="text-sm text-gray-500 max-w-sm">
        インターネット接続がありません。接続を確認してからもう一度お試しください。
      </p>
    </div>
  )
}
