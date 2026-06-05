"use client"

import { useRouter, useSearchParams } from "next/navigation"

type Student = { id: string; user: { name: string } }

export function GradeStudentFilter({ students }: { students: Student[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get("studentId") ?? ""

  function setStudent(id: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (id) {
      params.set("studentId", id)
    } else {
      params.delete("studentId")
    }
    router.push(`/grades?${params.toString()}`)
  }

  return (
    <select
      value={current}
      onChange={(e) => setStudent(e.target.value)}
      className="h-8 rounded-lg border border-input bg-background pl-2.5 pr-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <option value="">生徒: すべて</option>
      {students.map((s) => (
        <option key={s.id} value={s.id}>
          {s.user.name}
        </option>
      ))}
    </select>
  )
}
