function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className ?? ""}`} />
}

export default function Loading() {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>

      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-lg border bg-white p-5 space-y-3">
          <Skeleton className="h-5 w-40" />
          <div className="space-y-2.5">
            {[...Array(3)].map((_, j) => (
              <div key={j} className="flex gap-3">
                <Skeleton className="h-6 w-6 rounded-full shrink-0" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
