"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Select } from "@/components/ui/select"

type Subject = { id: string; name: string }

export function GradeSubjectFilter({ subjects }: { subjects: Subject[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get("subjectId") ?? ""

  function setSubject(id: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (id) {
      params.set("subjectId", id)
    } else {
      params.delete("subjectId")
    }
    router.push(`/grades?${params.toString()}`)
  }

  if (subjects.length === 0) return null

  return (
    <Select
      value={current}
      onChange={(e) => setSubject(e.target.value)}
      className="md:h-8 md:text-xs"
    >
      <option value="">科目: すべて</option>
      {subjects.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </Select>
  )
}
