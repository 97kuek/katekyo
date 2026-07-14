"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"

type Student = { id: string; user: { name: string } }
type Subject = { id: string; name: string }

export function HomeworkFilter({ students, subjects, children }: { students: Student[]; subjects: Subject[]; children?: React.ReactNode }) {
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
      <div className="flex items-center gap-2">
        <Input
          type="search"
          placeholder="タイトルで検索..."
          value={currentQ}
          onChange={(e) => update("q", e.target.value)}
          className="flex-1 md:h-9"
        />
        {children}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Select
          value={currentStudent}
          onChange={(e) => update("studentId", e.target.value)}
          containerClassName="sm:w-auto"
          className="md:h-8 md:text-xs"
        >
          <option value="">生徒: すべて</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>{s.user.name}</option>
          ))}
        </Select>

        <div className="flex items-center gap-0.5 rounded-lg border border-input bg-background p-0.5 shrink-0">
          <button
            onClick={() => update("sort", "created")}
            className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${currentSort === "created" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            作成日
          </button>
          <button
            onClick={() => update("sort", "due")}
            className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${currentSort === "due" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            期限
          </button>
        </div>

        {subjects.map((s) => {
          const active = currentSubjects.includes(s.id)
          return (
            <button
              key={s.id}
              onClick={() => toggleSubject(s.id)}
              className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${active ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-input hover:bg-muted"}`}
            >
              {s.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}
