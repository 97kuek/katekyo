import { Check } from "lucide-react"
import type { ComponentPropsWithoutRef, ReactNode } from "react"
import { cn } from "@/lib/utils"

export function ChoiceControl({
  label,
  className,
  ...inputProps
}: Omit<ComponentPropsWithoutRef<"input">, "children"> & {
  label: ReactNode
  className?: string
}) {
  return (
    <label
      className={cn(
        "inline-flex min-h-11 min-w-0 cursor-pointer items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-sm transition-[background-color,border-color,opacity] has-checked:border-primary/35 has-checked:bg-primary/10 has-disabled:cursor-not-allowed has-disabled:opacity-50 motion-reduce:transition-none",
        className
      )}
    >
      <input {...inputProps} className="peer sr-only" />
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-input bg-background text-primary peer-checked:border-primary peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 peer-checked:[&_svg]:opacity-100">
        <Check className="size-3.5 opacity-0 transition-opacity motion-reduce:transition-none" strokeWidth={3} aria-hidden />
      </span>
      <span className="min-w-0">{label}</span>
    </label>
  )
}
