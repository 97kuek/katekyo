"use client"

import { useRouter, useSearchParams } from "next/navigation"

export function StudentSort() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get("sort") ?? "date"

  function setSort(sort: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("sort", sort)
    router.push(`/students?${params.toString()}`)
  }

  const options = [
    { value: "date", label: "登録日順" },
    { value: "name", label: "名前順" },
    { value: "grade", label: "学年順" },
  ]

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">並び替え:</span>
      <div className="flex items-center gap-1 rounded-md border border-input bg-background p-0.5">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => setSort(o.value)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${current === o.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}
