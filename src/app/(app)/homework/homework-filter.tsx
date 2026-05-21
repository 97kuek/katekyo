"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"

type Student = { id: string; user: { name: string } }
type Subject = { id: string; name: string }

export function HomeworkFilter({ students, subjects }: { students: Student[]; subjects: Subject[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const currentStudent = searchParams.get("studentId") ?? ""
  const currentSort = searchParams.get("sort") ?? "created"
  const currentQ = searchParams.get("q") ?? ""
  const currentSubjects = searchParams.get("subjects")?.split(",").filter(Boolean) ?? []

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    startTransition(() => {
      router.push(`/homework?${params.toString()}`)
    })
  }

  function toggleSubject(id: string) {
    const params = new URLSearchParams(searchParams.toString())
    const next = currentSubjects.includes(id)
      ? currentSubjects.filter((s) => s !== id)
      : [...currentSubjects, id]
    if (next.length > 0) {
      params.set("subjects", next.join(","))
    } else {
      params.delete("subjects")
    }
    startTransition(() => {
      router.push(`/homework?${params.toString()}`)
    })
  }

  return (
    <div className={`space-y-2 transition-opacity duration-150 ${isPending ? "opacity-50 pointer-events-none" : ""}`}>
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

        <div className="flex items-center gap-2 flex-1 min-w-[180px] max-w-xs">
          <input
            type="search"
            placeholder="タイトルで検索..."
            value={currentQ}
            onChange={(e) => update("q", e.target.value)}
            className="h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
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

        {isPending && (
          <span className="text-xs text-muted-foreground animate-pulse">読み込み中...</span>
        )}
      </div>

      {subjects.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">科目:</span>
          {subjects.map((s) => {
            const active = currentSubjects.includes(s.id)
            return (
              <button
                key={s.id}
                onClick={() => toggleSubject(s.id)}
                className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${active ? "bg-blue-600 text-white border-blue-600" : "bg-white text-muted-foreground border-input hover:bg-gray-50"}`}
              >
                {s.name}
              </button>
            )
          })}
          {currentSubjects.length > 0 && (
            <button
              onClick={() => update("subjects", "")}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              クリア
            </button>
          )}
        </div>
      )}
    </div>
  )
}
