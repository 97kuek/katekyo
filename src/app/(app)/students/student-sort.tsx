"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useOptimistic, useTransition } from "react"
import { Select } from "@/components/ui/select"

export function StudentSort() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get("sort") ?? "date"
  const [optimisticCurrent, setOptimisticCurrent] = useOptimistic(current)
  const [isPending, startTransition] = useTransition()

  function setSort(sort: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("sort", sort)
    startTransition(() => {
      setOptimisticCurrent(sort)
      router.replace(`/students?${params.toString()}`, { scroll: false })
    })
  }

  const options = [
    { value: "date", label: "登録日順" },
    { value: "name", label: "名前順" },
    { value: "grade", label: "学年順" },
  ]

  return (
    <label className="flex items-center gap-2 text-xs text-muted-foreground">
      並び替え
      <Select value={optimisticCurrent} onChange={(event) => setSort(event.target.value)} aria-busy={isPending} containerClassName="w-auto" className="h-9 min-w-28 text-xs">
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </Select>
    </label>
  )
}
