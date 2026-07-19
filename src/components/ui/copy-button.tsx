"use client"

import { Check, Copy } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"

export function CopyButton({ value, label = "コピー" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }, [])

  async function copy() {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button type="button" variant="outline" onClick={copy} className="shrink-0" aria-live="polite">
      {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
      {copied ? "コピー済み" : label}
    </Button>
  )
}
