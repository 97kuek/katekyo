"use client"

import { useRouter, useSearchParams } from "next/navigation"

type Student = { id: string; user: { name: string } }

export function HomeworkFilter({ students }: { students: Student[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentStudent = searchParams.get("studentId") ?? ""
  const currentSort = searchParams.get("sort") ?? "created"

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/homework?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">生徒:</span>
        <select
          value={currentStudent}
          onChange={(e) => update("studentId", e.target.value)}
          className="h-8 rounded-md border border-input bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">すべて</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.user.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1 rounded-md border border-input bg-background p-0.5">
        <button
          onClick={() => update("sort", "created")}
          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${currentSort === "created" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          作成日順
        </button>
        <button
          onClick={() => update("sort", "due")}
          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${currentSort === "due" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          期限順
        </button>
      </div>
    </div>
  )
}
