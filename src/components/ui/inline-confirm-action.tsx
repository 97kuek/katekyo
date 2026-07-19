"use client"

import { useState, useTransition } from "react"
import type { ComponentProps, ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Props = {
  triggerLabel: string
  confirmLabel: string
  pendingLabel?: string
  message: string
  onConfirm: () => Promise<void>
  destructive?: boolean
  triggerVariant?: ComponentProps<typeof Button>["variant"]
  triggerSize?: ComponentProps<typeof Button>["size"]
  triggerClassName?: string
  triggerIcon?: ReactNode
}

export function InlineConfirmAction({
  triggerLabel,
  confirmLabel,
  pendingLabel = "処理中...",
  message,
  onConfirm,
  destructive = true,
  triggerVariant = "ghost",
  triggerSize = "xs",
  triggerClassName,
  triggerIcon,
}: Props) {
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (!confirming) {
    return (
      <Button
        type="button"
        variant={triggerVariant}
        size={triggerSize}
        aria-expanded={false}
        className={cn(destructive && "text-destructive hover:bg-muted hover:text-destructive", triggerClassName)}
        onClick={() => setConfirming(true)}
      >
        {triggerIcon}
        {triggerLabel}
      </Button>
    )
  }

  return (
    <div
      role="group"
      aria-label={message}
      className={cn(
        "basis-full min-w-0 w-full rounded-xl border p-2.5 origin-top animate-in fade-in-0 slide-in-from-top-1 duration-150 motion-reduce:animate-none",
        destructive ? "border-destructive/25 bg-destructive/8" : "border-border bg-muted/70"
      )}
    >
      <p className="break-words text-xs leading-relaxed text-foreground">{message}</p>
      <div className="mt-2 flex items-center justify-end gap-1.5">
        <Button type="button" variant="ghost" size="xs" disabled={isPending} onClick={() => setConfirming(false)}>
          戻る
        </Button>
        <Button
          type="button"
          variant={destructive ? "ghost" : "default"}
          size="xs"
          className={destructive ? "text-destructive hover:bg-muted hover:text-destructive" : undefined}
          disabled={isPending}
          onClick={() => startTransition(onConfirm)}
        >
          {isPending ? pendingLabel : confirmLabel}
        </Button>
      </div>
    </div>
  )
}
