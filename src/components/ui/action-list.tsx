import Link from "next/link"
import { ChevronRight } from "lucide-react"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function RowContent({ icon, label, description, destructive = false, expanded }: {
  icon: ReactNode
  label: string
  description?: string
  destructive?: boolean
  expanded?: boolean
}) {
  return (
    <>
      <span className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-lg",
        destructive ? "bg-muted text-destructive" : "bg-muted text-foreground"
      )}>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn("block text-sm font-medium", destructive && "text-destructive")}>{label}</span>
        {description && <span className="mt-0.5 block text-xs font-normal leading-relaxed text-muted-foreground">{description}</span>}
      </span>
      <ChevronRight className={cn("size-4 shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none", expanded && "rotate-90")} aria-hidden />
    </>
  )
}

export function ActionList({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("apple-card-surface divide-y overflow-hidden rounded-2xl", className)}>{children}</div>
}

export function ActionLink({ href, icon, label, description }: {
  href: string
  icon: ReactNode
  label: string
  description?: string
}) {
  return (
    <Link href={href} className="flex min-h-14 items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/65 active:bg-muted">
      <RowContent icon={icon} label={label} description={description} />
    </Link>
  )
}

export function ActionButton({ icon, label, description, destructive = false, expanded, onClick }: {
  icon: ReactNode
  label: string
  description?: string
  destructive?: boolean
  expanded?: boolean
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      className="h-auto min-h-14 w-full justify-start gap-3 rounded-none px-4 py-3 text-left font-normal"
      aria-expanded={expanded}
      onClick={onClick}
    >
      <RowContent icon={icon} label={label} description={description} destructive={destructive} expanded={expanded} />
    </Button>
  )
}
