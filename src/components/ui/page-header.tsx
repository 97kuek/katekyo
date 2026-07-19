import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

export function PageHeader({
  title,
  description,
  backHref,
  backLabel = "戻る",
  action,
  secondaryAction,
  className,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  backHref?: string
  backLabel?: string
  action?: React.ReactNode
  secondaryAction?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex min-h-9 items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {backLabel}
        </Link>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {(action || secondaryAction) && (
          <div className="flex shrink-0 items-center gap-2">
            {secondaryAction}
            {action}
          </div>
        )}
      </div>
    </div>
  )
}
