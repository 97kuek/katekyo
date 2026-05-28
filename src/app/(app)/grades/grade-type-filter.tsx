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

  const base =
    "px-3 py-1.5 rounded-md text-sm border transition-colors"
  const active = "bg-primary text-primary-foreground border-primary"
  const inactive = "bg-card text-muted-foreground border-input hover:bg-muted"

  return (
    <div className="flex gap-1.5 flex-wrap">
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
