const statusConfig = {
  assigned:  { label: "未提出",   dot: "bg-gray-400" },
  submitted: { label: "提出済み", dot: "bg-amber-500" },
  approved:  { label: "承認済み", dot: "bg-green-500" },
  rejected:  { label: "差し戻し", dot: "bg-red-500" },
}

export function StatusBadge({ status }: { status: keyof typeof statusConfig }) {
  const { label, dot } = statusConfig[status]
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dot}`} />
      {label}
    </span>
  )
}
