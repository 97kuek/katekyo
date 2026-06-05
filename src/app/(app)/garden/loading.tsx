export default function GardenLoading() {
  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 bg-muted rounded animate-pulse" />
        <div className="h-4 w-12 bg-muted rounded animate-pulse" />
      </div>
      <div className="rounded-lg border bg-card p-4">
        <div className="w-full aspect-[560/450] bg-muted rounded animate-pulse" />
      </div>
    </div>
  )
}
