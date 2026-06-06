function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className ?? ""}`} />
}

export default function Loading() {
  return (
    <div className="max-w-lg space-y-6">
      <Skeleton className="h-4 w-40" />
      <div className="rounded-lg border bg-card p-5 space-y-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
    </div>
  )
}
