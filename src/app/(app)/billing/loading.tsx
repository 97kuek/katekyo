function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className ?? ""}`} />
}

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-4 w-56" />
      </div>

      <div className="flex items-center justify-center gap-3">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-8 w-8" />
      </div>

      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-28" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>

      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {[...Array(2)].map((_, i) => (
          <Skeleton key={i} className="h-8 flex-1 bg-background" />
        ))}
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="divide-y">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-4">
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-36" />
              </div>
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-8 w-8" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
