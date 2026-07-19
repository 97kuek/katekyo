function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className ?? ""}`} />
}

export default function Loading() {
  return (
    <div className="max-w-lg space-y-6">
      <Skeleton className="h-4 w-32" />
      <div className="apple-card-surface rounded-2xl p-5 space-y-5">
        <Skeleton className="h-5 w-20" />
        <div className="grid grid-cols-2 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className={`space-y-2 ${i < 2 ? "col-span-2" : ""}`}>
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
        <Skeleton className="h-10 w-28" />
      </div>
    </div>
  )
}
