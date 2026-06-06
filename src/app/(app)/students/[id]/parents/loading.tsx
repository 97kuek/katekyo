function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className ?? ""}`} />
}

export default function Loading() {
  return (
    <div className="max-w-lg space-y-6">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-7 w-48" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-4 flex items-center justify-between gap-3">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-40" />
          </div>
          <Skeleton className="h-8 w-16 rounded-full shrink-0" />
        </div>
      ))}
    </div>
  )
}
