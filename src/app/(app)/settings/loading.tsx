function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className ?? ""}`} />
}

export default function Loading() {
  return (
    <div className="max-w-lg space-y-8">
      {[...Array(3)].map((_, s) => (
        <section key={s} className="space-y-4">
          <Skeleton className="h-4 w-24" />
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-11 w-full" />
          </div>
        </section>
      ))}
    </div>
  )
}
