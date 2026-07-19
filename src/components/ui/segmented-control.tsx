"use client"

import { cn } from "@/lib/utils"

export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string
  value: T
  options: ReadonlyArray<{ value: T; label: string; count?: number }>
  onChange: (value: T) => void
  className?: string
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn("inline-flex items-center rounded-lg border border-input bg-background p-1", className)}
    >
      {options.map((option) => {
        const active = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "min-h-11 rounded-md px-3 text-xs font-medium transition-[background-color,opacity] focus-visible:ring-2 focus-visible:ring-ring active:opacity-75 motion-reduce:transition-none md:min-h-9",
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {option.label}{option.count != null ? ` ${option.count}` : ""}
          </button>
        )
      })}
    </div>
  )
}
