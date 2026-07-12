import { HOMEWORK_STATUS_CONFIG } from "@/lib/homework-status"

export function StatusBadge({ status }: { status: keyof typeof HOMEWORK_STATUS_CONFIG }) {
  const { label, dot } = HOMEWORK_STATUS_CONFIG[status]
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dot}`} />
      {label}
    </span>
  )
}
