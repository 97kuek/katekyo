"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Select } from "@/components/ui/select"

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
    <Select
      value={current}
      onChange={(e) => setStudent(e.target.value)}
      className="md:h-8 md:text-xs"
    >
      <option value="">生徒: すべて</option>
      {students.map((s) => (
        <option key={s.id} value={s.id}>
          {s.user.name}
        </option>
      ))}
    </Select>
  )
}
