"use client"

import { useRouter, useSearchParams } from "next/navigation"

type Student = { id: string; user: { name: string } }

export function HomeworkFilter({ students }: { students: Student[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentStudent = searchParams.get("studentId") ?? ""

  function setStudent(studentId: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (studentId) {
      params.set("studentId", studentId)
    } else {
      params.delete("studentId")
    }
    router.push(`/homework?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-muted-foreground">生徒で絞り込み:</span>
      <select
        value={currentStudent}
        onChange={(e) => setStudent(e.target.value)}
        className="h-8 rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="">すべての生徒</option>
        {students.map((s) => (
          <option key={s.id} value={s.id}>
            {s.user.name}
          </option>
        ))}
      </select>
    </div>
  )
}
