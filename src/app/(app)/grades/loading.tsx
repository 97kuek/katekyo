function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className ?? ""}`} />
}

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-9 w-28" />
      </div>

      <div className="flex gap-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="border-b bg-muted px-4 py-3 flex gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-4 w-16" />
          ))}
        </div>
        <div className="divide-y">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-4">
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-4 w-16 shrink-0" />
              <Skeleton className="h-4 w-12 shrink-0" />
              <Skeleton className="h-4 w-12 shrink-0" />
              <Skeleton className="h-4 w-12 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
