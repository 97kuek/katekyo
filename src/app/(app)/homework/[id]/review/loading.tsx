function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className ?? ""}`} />
}

export default function Loading() {
  return (
    <div className="max-w-lg space-y-6">
      <Skeleton className="h-4 w-32" />
      <div className="rounded-lg border bg-white p-5 space-y-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-16 w-full rounded-md" />
      </div>
      <div className="rounded-lg border bg-white p-5 space-y-4">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-20 w-full" />
        <div className="flex gap-3">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 flex-1" />
        </div>
      </div>
    </div>
  )
}
