"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"

type Props = {
  triggerLabel: string
  confirmLabel: string
  pendingLabel?: string
  message: string
  onConfirm: () => Promise<void>
  destructive?: boolean
}

export function InlineConfirmAction({
  triggerLabel,
  confirmLabel,
  pendingLabel = "処理中...",
  message,
  onConfirm,
  destructive = true,
}: Props) {
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="xs"
        className={destructive ? "text-destructive hover:bg-muted hover:text-destructive" : undefined}
        onClick={() => setConfirming(true)}
      >
        {triggerLabel}
      </Button>
    )
  }

  return (
    <div className={`flex flex-wrap items-center justify-end gap-2 rounded-lg border p-2 ${destructive ? "border-destructive/25 bg-destructive/10" : "border-border bg-muted"}`}>
      <span className="text-xs text-foreground">{message}</span>
      <Button type="button" variant="ghost" size="xs" disabled={isPending} onClick={() => setConfirming(false)}>
        戻る
      </Button>
      <Button
        type="button"
        variant={destructive ? "destructive" : "default"}
        size="xs"
        disabled={isPending}
        onClick={() => startTransition(onConfirm)}
      >
        {isPending ? pendingLabel : confirmLabel}
      </Button>
    </div>
  )
}
