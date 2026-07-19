"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useOptimistic, useTransition } from "react"
import { TEST_TYPE_OPTIONS } from "@/lib/test-types"
import { Button } from "@/components/ui/button"

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

  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-input bg-background p-0.5 overflow-x-auto" aria-busy={isPending}>
      <Button
        type="button"
        size="xs"
        variant={optimisticCurrent === "" ? "default" : "ghost"}
        onClick={() => setType("")}
      >
        すべて
      </Button>
      {TEST_TYPE_OPTIONS.map(([value, label]) => (
        <Button
          key={value}
          type="button"
          size="xs"
          variant={optimisticCurrent === value ? "default" : "ghost"}
          onClick={() => setType(value)}
        >
          {label}
        </Button>
      ))}
    </div>
  )
}
