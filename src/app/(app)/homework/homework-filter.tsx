"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, useTransition } from "react"
import { ListFilter, Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

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
  const [query, setQuery] = useState(currentQ)
  const activeFilterCount = Number(Boolean(currentStudent)) + currentSubjects.length + Number(currentSort !== "created")

  useEffect(() => {
    if (query === currentQ) return
    const timer = window.setTimeout(() => update("q", query), 350)
    return () => window.clearTimeout(timer)
    // update intentionally reads the latest searchParams; query is the user-controlled trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, currentQ])

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    startTransition(() => {
      router.replace(`/homework?${params.toString()}`, { scroll: false })
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
      router.replace(`/homework?${params.toString()}`, { scroll: false })
    })
  }

  function clearFilters() {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("studentId")
    params.delete("sort")
    params.delete("subjects")
    startTransition(() => router.replace(`/homework?${params.toString()}`, { scroll: false }))
  }

  return (
    <div className={`space-y-2 transition-opacity duration-150 ${isPending ? "opacity-50 pointer-events-none" : ""}`}>
      <div className="flex items-center gap-2">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">宿題を検索</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            placeholder="宿題を検索"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 md:h-9"
          />
        </label>
        <details className="group relative">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-1.5 rounded-full border bg-background px-3 text-sm font-medium hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
            <ListFilter className="h-4 w-4" aria-hidden />
            絞り込み{activeFilterCount > 0 ? `（${activeFilterCount}）` : ""}
          </summary>
          <div className="absolute right-0 top-[calc(100%+0.5rem)] z-30 w-[min(22rem,calc(100vw-2rem))] space-y-4 rounded-lg border bg-popover p-4 shadow-lg">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">絞り込み</p>
              {activeFilterCount > 0 && (
                <Button type="button" variant="ghost" size="xs" onClick={clearFilters}>
                  <X className="h-3.5 w-3.5" aria-hidden />クリア
                </Button>
              )}
            </div>
            <label className="block space-y-1.5 text-xs font-medium text-muted-foreground">
              生徒
              <Select
                value={currentStudent}
                onChange={(e) => update("studentId", e.target.value)}
              >
                <option value="">すべての生徒</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.user.name}</option>
                ))}
              </Select>
            </label>
            <fieldset className="space-y-2">
              <legend className="text-xs font-medium text-muted-foreground">並び順</legend>
              <div className="grid grid-cols-2 gap-2">
                {[{ value: "created", label: "作成日" }, { value: "due", label: "期限" }].map((option) => (
                  <button
                    type="button"
                    key={option.value}
                    aria-pressed={currentSort === option.value}
                    onClick={() => update("sort", option.value)}
                    className={`min-h-10 rounded-lg border px-3 text-sm ${currentSort === option.value ? "border-primary bg-primary/10 text-foreground" : "hover:bg-muted"}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </fieldset>
            {subjects.length > 0 && (
              <fieldset className="space-y-2">
                <legend className="text-xs font-medium text-muted-foreground">科目</legend>
                <div className="flex flex-wrap gap-2">
                  {subjects.map((s) => {
                    const active = currentSubjects.includes(s.id)
                    return (
                      <button
                        type="button"
                        key={s.id}
                        aria-pressed={active}
                        onClick={() => toggleSubject(s.id)}
                        className={`min-h-9 rounded-full border px-3 text-xs ${active ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                      >
                        {s.name}
                      </button>
                    )
                  })}
                </div>
              </fieldset>
            )}
          </div>
        </details>
      </div>

      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <span>適用中:</span>
          {currentStudent && <span className="rounded-full bg-muted px-2 py-1">生徒</span>}
          {currentSort === "due" && <span className="rounded-full bg-muted px-2 py-1">期限順</span>}
          {currentSubjects.map((id) => (
            <span key={id} className="rounded-full bg-muted px-2 py-1">{subjects.find((s) => s.id === id)?.name ?? "科目"}</span>
          ))}
        </div>
      )}
    </div>
  )
}
