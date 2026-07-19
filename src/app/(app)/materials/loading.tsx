function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className ?? ""}`} />
}

export default function Loading() {
  return (
    <div className="max-w-2xl space-y-6">
      <Skeleton className="h-6 w-32" />
      {[...Array(4)].map((_, i) => (
        <div key={i} className="apple-card-surface rounded-2xl p-4 space-y-2">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  )
}
