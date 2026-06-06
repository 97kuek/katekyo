function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className ?? ""}`} />
}

export default function Loading() {
  return (
    <div className="max-w-2xl space-y-5">
      <Skeleton className="h-4 w-32" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-12" />
      </div>
      <div className="rounded-lg border bg-card p-4">
        <Skeleton className="w-full aspect-[560/450] rounded" />
      </div>
    </div>
  )
}
