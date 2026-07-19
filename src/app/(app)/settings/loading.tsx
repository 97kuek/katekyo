function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className ?? ""}`} />
}

export default function Loading() {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-4 w-56" />
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 border-b p-4 last:border-b-0">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-52" />
            </div>
            <Skeleton className="h-5 w-5" />
          </div>
        ))}
      </div>
    </div>
  )
}
