function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className ?? ""}`} />
}

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-4 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-8 w-12" />
          </div>
        ))}
      </div>

      {[...Array(2)].map((_, i) => (
        <div key={i} className="rounded-lg border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b bg-muted gap-3">
            <Skeleton className="h-4 w-24" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-7 w-20" />
            </div>
          </div>
          <div className="divide-y">
            {[...Array(3)].map((_, j) => (
              <div key={j} className="px-5 py-3 flex items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-4 w-14 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
