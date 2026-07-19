"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useOptimistic, useTransition } from "react"
import { Select } from "@/components/ui/select"

type Student = { id: string; user: { name: string } }

export function GradeStudentFilter({ students }: { students: Student[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get("studentId") ?? ""
  const [optimisticCurrent, setOptimisticCurrent] = useOptimistic(current)
  const [isPending, startTransition] = useTransition()

  function setStudent(id: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (id) {
      params.set("studentId", id)
    } else {
      params.delete("studentId")
    }
    startTransition(() => {
      setOptimisticCurrent(id)
      router.replace(`/grades?${params.toString()}`, { scroll: false })
    })
  }

  return (
    <Select
      value={optimisticCurrent}
      onChange={(e) => setStudent(e.target.value)}
      aria-busy={isPending}
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
