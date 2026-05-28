function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className ?? ""}`} />
}

export default function Loading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-48 mt-2" />
        <Skeleton className="h-4 w-16 mt-1" />
      </div>
      <div className="rounded-lg border bg-card p-5">
        <Skeleton className="h-56 w-full" />
      </div>
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="border-b bg-muted px-4 py-3 flex gap-4">
          {[...Array(7)].map((_, i) => (
            <Skeleton key={i} className="h-4 w-12" />
          ))}
        </div>
        <div className="divide-y">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="px-4 py-3 flex gap-4">
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
