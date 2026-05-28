"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { TEST_TYPE_OPTIONS } from "@/lib/test-types"

export function GradeTypeFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get("type") ?? ""

  function setType(type: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (type) {
      params.set("type", type)
    } else {
      params.delete("type")
    }
    router.push(`/grades?${params.toString()}`)
  }

  const base = "px-2.5 py-1.5 rounded text-xs font-medium transition-colors"
  const active = "bg-primary text-primary-foreground"
  const inactive = "text-muted-foreground hover:text-foreground"

  return (
    <div className="flex items-center gap-0.5 rounded-md border border-input bg-background p-0.5">
      <button
        type="button"
        onClick={() => setType("")}
        className={`${base} ${current === "" ? active : inactive}`}
      >
        すべて
      </button>
      {TEST_TYPE_OPTIONS.map(([value, label]) => (
        <button
          key={value}
          type="button"
          onClick={() => setType(value)}
          className={`${base} ${current === value ? active : inactive}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
