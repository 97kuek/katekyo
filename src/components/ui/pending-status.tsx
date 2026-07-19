"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { LoaderCircle } from "lucide-react"

type Stage = "quiet" | "spinner" | "long"

function ActivePendingStatus({ label }: { label: string }) {
  const [stage, setStage] = useState<Stage>("quiet")

  useEffect(() => {
    const spinnerTimer = window.setTimeout(() => setStage("spinner"), 1_000)
    const longTimer = window.setTimeout(() => setStage("long"), 4_000)
    return () => {
      window.clearTimeout(spinnerTimer)
      window.clearTimeout(longTimer)
    }
  }, [])

  if (stage === "quiet") return null
  if (stage === "spinner") {
    return createPortal(
      <p role="status" className="translucent-chrome pointer-events-none fixed right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-[100] flex min-h-11 items-center gap-2 rounded-full border bg-background/95 px-3 text-xs font-medium text-foreground shadow-md backdrop-blur">
        <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
        {label}
      </p>,
      document.body
    )
  }
  return createPortal(
    <div role="status" className="pointer-events-none fixed inset-x-0 top-0 z-[101]">
      <div className="h-1 overflow-hidden bg-muted" aria-hidden>
        <div className="h-full w-2/5 animate-navigation-progress rounded-r-full bg-primary" />
      </div>
      <p className="mx-auto mt-2 w-fit rounded-full border bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-sm">
        {label}。処理を続けています
      </p>
    </div>,
    document.body
  )
}

export function PendingStatus({ pending, label = "送信しています" }: { pending: boolean; label?: string }) {
  return pending ? <ActivePendingStatus label={label} /> : null
}
