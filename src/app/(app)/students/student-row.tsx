"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { PendingStatus } from "@/components/ui/pending-status"

export function StudentRow({ href, children }: { href: string; children: React.ReactNode }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function navigate() {
    startTransition(() => router.push(href))
  }

  return (
    <tr
      role="link"
      tabIndex={0}
      aria-busy={isPending}
      onPointerEnter={() => router.prefetch(href)}
      onFocus={() => router.prefetch(href)}
      onClick={navigate}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          navigate()
        }
      }}
      className={`cursor-pointer transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${isPending ? "opacity-60" : ""}`}
    >
      <PendingStatus pending={isPending} label="生徒の詳細を読み込んでいます" />
      {children}
    </tr>
  )
}
