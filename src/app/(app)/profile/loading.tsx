function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className ?? ""}`} />
}

export default function Loading() {
  return (
    <div className="max-w-lg space-y-6">
      <div className="space-y-1.5">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-48" />
      </div>
      {[...Array(2)].map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-5 space-y-4">
          <Skeleton className="h-5 w-28" />
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-9 w-16" />
          </div>
        </div>
      ))}
    </div>
  )
}
