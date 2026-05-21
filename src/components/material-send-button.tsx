"use client"

import { useRef, useState, useTransition } from "react"
import { Camera, Check, Copy } from "lucide-react"
import { sendMaterialPhoto } from "@/app/(app)/calendar/actions"

type State = "idle" | "sent" | "copy"

export function MaterialSendButton({ lessonId }: { lessonId: string }) {
  const [state, setState] = useState<State>("idle")
  const [url, setUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)

    startTransition(async () => {
      const fd = new FormData()
      fd.append("lessonId", lessonId)
      fd.append("photo", file)
      const result = await sendMaterialPhoto(fd)

      if (result.error) {
        setError(result.error)
        return
      }
      if (result.sent) {
        setState("sent")
      } else {
        setState("copy")
        setUrl(result.url ?? null)
      }
    })

    e.target.value = ""
  }

  async function handleCopy() {
    if (!url) return
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (state === "sent") {
    return (
      <span className="text-xs text-green-600 font-medium mt-1.5 inline-block">
        ✓ 先生のLINEに送りました
      </span>
    )
  }

  if (state === "copy" && url) {
    return (
      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-1 mt-1.5 text-xs font-medium text-blue-600 hover:text-blue-800"
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        {copied ? "コピーしました" : "URLをコピー（Meetのチャットに貼り付けて送ってください）"}
      </button>
    )
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={isPending}
        className="inline-flex items-center gap-1 mt-1.5 text-xs font-medium text-orange-600 hover:text-orange-800 border border-orange-200 rounded px-2.5 py-1 disabled:opacity-50"
      >
        <Camera className="h-3 w-3" />
        {isPending ? "送信中..." : "教材を送る"}
      </button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
