function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className ?? ""}`} />
}

export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-white overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>

        <div className="grid grid-cols-7 text-center">
          {["日", "月", "火", "水", "木", "金", "土"].map((d) => (
            <div key={d} className="py-2 flex justify-center">
              <Skeleton className="h-3 w-3" />
            </div>
          ))}
          {[...Array(35)].map((_, i) => (
            <div key={i} className="aspect-square flex flex-col items-center justify-start pt-1.5 gap-1">
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
          ))}
        </div>

        <div className="px-3 pb-3 pt-1 border-t flex gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-3 w-16" />
          ))}
        </div>
      </div>

      <div className="rounded-lg border bg-white p-4 space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-16 w-full rounded-md" />
      </div>
    </div>
  )
}
