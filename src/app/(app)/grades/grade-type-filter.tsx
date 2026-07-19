"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useOptimistic, useTransition } from "react"
import { TEST_TYPE_OPTIONS } from "@/lib/test-types"

export function GradeTypeFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get("type") ?? ""
  const [optimisticCurrent, setOptimisticCurrent] = useOptimistic(current)
  const [isPending, startTransition] = useTransition()

  function setType(type: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (type) {
      params.set("type", type)
    } else {
      params.delete("type")
    }
    startTransition(() => {
      setOptimisticCurrent(type)
      router.replace(`/grades?${params.toString()}`, { scroll: false })
    })
  }

  const base = "px-2 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap"
  const active = "bg-primary text-primary-foreground"
  const inactive = "text-muted-foreground hover:text-foreground"

  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-input bg-background p-0.5 overflow-x-auto" aria-busy={isPending}>
      <button
        type="button"
        onClick={() => setType("")}
        className={`${base} ${optimisticCurrent === "" ? active : inactive}`}
      >
        すべて
      </button>
      {TEST_TYPE_OPTIONS.map(([value, label]) => (
        <button
          key={value}
          type="button"
          onClick={() => setType(value)}
          className={`${base} ${optimisticCurrent === value ? active : inactive}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
