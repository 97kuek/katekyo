export default function GardenLoading() {
  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="rounded-xl border bg-white p-4">
        <div className="w-full aspect-[560/415] bg-gray-100 rounded animate-pulse" />
      </div>
    </div>
  )
}
