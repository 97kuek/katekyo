"use client"

import { useFormStatus } from "react-dom"
import { LoaderCircle } from "lucide-react"

export function PendingSubmitButton({
  children,
  pendingLabel = "更新中",
  className,
}: {
  children: React.ReactNode
  pendingLabel?: string
  className?: string
}) {
  const { pending } = useFormStatus()

  return (
    <button type="submit" disabled={pending} aria-disabled={pending} className={className}>
      {pending ? <><LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden />{pendingLabel}</> : children}
    </button>
  )
}
