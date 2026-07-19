function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className ?? ""}`} />
}

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-52" />
        </div>
        <Skeleton className="h-9 w-20" />
      </div>

      <div className="apple-card-surface rounded-2xl p-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-2 h-5 w-52" />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-9 w-36" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="apple-card-surface space-y-2 rounded-2xl p-2 text-center">
              <Skeleton className="mx-auto h-3 w-6" />
              <Skeleton className="mx-auto h-8 w-8 rounded-full" />
              <Skeleton className="mx-auto h-2 w-2 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      <div className="apple-card-surface overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
        <div className="divide-y">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
