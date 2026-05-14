const statusConfig = {
  assigned: { label: "未提出", className: "bg-gray-100 text-gray-700" },
  submitted: { label: "提出済み", className: "bg-yellow-100 text-yellow-800" },
  approved: { label: "承認済み", className: "bg-green-100 text-green-800" },
  rejected: { label: "差し戻し", className: "bg-red-100 text-red-800" },
}

export function StatusBadge({ status }: { status: keyof typeof statusConfig }) {
  const { label, className } = statusConfig[status]
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}
