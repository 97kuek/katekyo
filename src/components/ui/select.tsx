import * as React from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

function Select({
  className,
  containerClassName,
  children,
  ...props
}: React.ComponentProps<"select"> & { containerClassName?: string }) {
  return (
    <div className={cn("relative w-full min-w-0 max-w-full", containerClassName)}>
      <select
        data-slot="select"
        className={cn(
          "h-11 w-full min-w-0 max-w-full appearance-none rounded-lg border border-input bg-transparent pl-3 pr-9 py-2 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 user-invalid:border-destructive user-invalid:ring-3 user-invalid:ring-destructive/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
    </div>
  )
}

export { Select }
