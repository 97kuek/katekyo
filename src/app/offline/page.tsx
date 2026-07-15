import { WifiOff } from "lucide-react"

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center p-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <WifiOff className="h-8 w-8" aria-hidden />
      </div>
      <p className="text-xl font-semibold text-foreground">オフラインです</p>
      <p className="text-sm text-muted-foreground max-w-sm">
        インターネット接続がありません。接続を確認してからもう一度お試しください。
      </p>
    </div>
  )
}
