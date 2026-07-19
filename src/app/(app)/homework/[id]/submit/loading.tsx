function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className ?? ""}`} />
}

export default function Loading() {
  return (
    <div className="max-w-lg space-y-6">
      <Skeleton className="h-4 w-32" />
      <div className="apple-card-surface rounded-2xl p-5 space-y-3">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-16 w-full" />
      </div>
      <div className="apple-card-surface rounded-2xl p-5 space-y-4">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  )
}
