const statusConfig = {
  assigned:  { label: "未提出",   dot: "bg-muted-foreground/50" },
  submitted: { label: "提出済み", dot: "bg-amber-500" },
  approved:  { label: "承認済み", dot: "bg-primary" },
  rejected:  { label: "差し戻し", dot: "bg-destructive" },
}

export function StatusBadge({ status }: { status: keyof typeof statusConfig }) {
  const { label, dot } = statusConfig[status]
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dot}`} />
      {label}
    </span>
  )
}
