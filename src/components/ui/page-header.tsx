"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useEffect, useRef, useState, type ReactNode } from "react"
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
  title: ReactNode
  description?: ReactNode
  backHref?: string
  backLabel?: string
  action?: ReactNode
  secondaryAction?: ReactNode
  className?: string
}) {
  const headerRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<number | null>(null)
  const [compact, setCompact] = useState(false)

  useEffect(() => {
    const scrollContainer = headerRef.current?.closest("main")
    if (!scrollContainer) return

    const update = () => {
      frameRef.current = null
      const scrollTop = scrollContainer.scrollTop
      // Hysteresis prevents the toolbar from flickering while its own height changes.
      setCompact((current) => (current ? scrollTop > 12 : scrollTop > 48))
    }
    const onScroll = () => {
      if (frameRef.current === null) frameRef.current = requestAnimationFrame(update)
    }

    update()
    scrollContainer.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      scrollContainer.removeEventListener("scroll", onScroll)
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    }
  }, [])

  return (
    <div
      ref={headerRef}
      data-compact={compact || undefined}
      className={cn(
        "sticky top-0 z-40 -mx-3 rounded-b-3xl px-3 transition-[padding,background-color,border-color,box-shadow,backdrop-filter] duration-300 motion-reduce:transition-none",
        compact ? "liquid-glass-chrome py-2 shadow-sm" : "border-transparent py-0",
        className
      )}
    >
      <div className={cn(compact ? "flex items-center gap-1.5" : "space-y-2")}>
        {backHref && (
          <Link
            href={backHref}
            aria-label={compact ? backLabel : undefined}
            className={cn(
              "inline-flex min-h-11 shrink-0 items-center rounded-full text-sm text-muted-foreground transition-[color,background-color,opacity] hover:bg-muted/70 hover:text-foreground active:opacity-70 motion-reduce:transition-none",
              compact ? "size-11 justify-center" : "gap-1 px-1"
            )}
          >
            <ArrowLeft className="size-4" aria-hidden />
            <span className={cn(compact && "sr-only")}>{backLabel}</span>
          </Link>
        )}
        <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
          <div className="min-w-0 flex-1 self-center">
            <h1
              className={cn(
                "truncate font-bold tracking-tight transition-[font-size,line-height] duration-300 motion-reduce:transition-none",
                compact ? "text-base leading-6 sm:text-lg" : "text-2xl leading-8 sm:text-3xl sm:leading-9"
              )}
            >
              {title}
            </h1>
            {description && (
              <div
                aria-hidden={compact || undefined}
                className={cn(
                  "grid transition-[grid-template-rows,opacity,margin] duration-300 motion-reduce:transition-none",
                  compact ? "mt-0 grid-rows-[0fr] opacity-0" : "mt-1 grid-rows-[1fr] opacity-100"
                )}
              >
                <p className="min-h-0 overflow-hidden text-sm text-muted-foreground">{description}</p>
              </div>
            )}
          </div>
          {(action || secondaryAction) && (
            <div className="flex shrink-0 items-center gap-2 self-center">
              {secondaryAction}
              {action}
            </div>
          )}
        </div>
      </div>
      {compact && (
        <div
          className="pointer-events-none absolute inset-x-3 -bottom-3 h-3 bg-gradient-to-b from-background/25 to-transparent"
          aria-hidden
        />
      )}
    </div>
  )
}
