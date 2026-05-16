"use client"

import { useState } from "react"

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
      className="text-xs text-blue-600 hover:text-blue-800 hover:underline whitespace-nowrap"
    >
      {copied ? "コピー済み ✓" : "URLをコピー"}
    </button>
  )
}
