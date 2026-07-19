"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CopyInviteLink({ token }: { token: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    const url = `${window.location.origin}/invite/${token}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="xs"
      onClick={copy}
    >
      {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
      {copied ? "コピー済み" : "URLをコピー"}
    </Button>
  )
}
