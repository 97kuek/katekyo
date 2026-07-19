"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"

const PARENT_STUDENT_COOKIE = "katekyo_parent_student"

export function ParentStudentSwitcher({ students, selectedStudentId }: { students: Array<{ id: string; name: string }>; selectedStudentId: string }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  if (students.length <= 1) return null

  return (
    <nav aria-label="お子さまを切り替え" className="flex gap-2 overflow-x-auto">
      {students.map((student) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set("studentId", student.id)
        const selected = student.id === selectedStudentId
        return (
          <Link
            key={student.id}
            href={`${pathname}?${params.toString()}`}
            onClick={() => { document.cookie = `${PARENT_STUDENT_COOKIE}=${encodeURIComponent(student.id)}; path=/; max-age=31536000; samesite=lax` }}
            aria-current={selected ? "page" : undefined}
            className={`flex min-h-10 items-center whitespace-nowrap rounded-full border px-4 text-sm font-medium ${selected ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted"}`}
          >
            {student.name}
          </Link>
        )
      })}
    </nav>
  )
}
