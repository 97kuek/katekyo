"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"

export function CopyInviteLink({ token }: { token: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    const url = `${window.location.origin}/invite/${token}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copy}
      className="text-xs text-primary hover:text-primary/80 hover:underline whitespace-nowrap"
    >
      <span className="inline-flex items-center gap-1">
        {copied ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
        {copied ? "コピー済み" : "URLをコピー"}
      </span>
    </button>
  )
}
