function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className ?? ""}`} />
}

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-7 w-40" />
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="border-b bg-muted px-4 py-3 flex gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-4 w-20" />
          ))}
        </div>
        <div className="divide-y">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-4">
              <Skeleton className="h-4 w-32 flex-1" />
              <Skeleton className="h-4 w-20 shrink-0" />
              <Skeleton className="h-4 w-16 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
