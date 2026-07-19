"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useOptimistic, useTransition } from "react"
import { Select } from "@/components/ui/select"

type Subject = { id: string; name: string }

export function GradeSubjectFilter({ subjects }: { subjects: Subject[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get("subjectId") ?? ""
  const [optimisticCurrent, setOptimisticCurrent] = useOptimistic(current)
  const [isPending, startTransition] = useTransition()

  function setSubject(id: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (id) {
      params.set("subjectId", id)
    } else {
      params.delete("subjectId")
    }
    startTransition(() => {
      setOptimisticCurrent(id)
      router.replace(`/grades?${params.toString()}`, { scroll: false })
    })
  }

  if (subjects.length === 0) return null

  return (
    <Select
      value={optimisticCurrent}
      onChange={(e) => setSubject(e.target.value)}
      aria-busy={isPending}
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
