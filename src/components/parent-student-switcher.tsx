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
            prefetch={true}
            onClick={() => { document.cookie = `${PARENT_STUDENT_COOKIE}=${encodeURIComponent(student.id)}; path=/; max-age=31536000; samesite=lax` }}
            aria-current={selected ? "page" : undefined}
            className={`flex min-h-11 items-center whitespace-nowrap rounded-full border px-4 text-sm font-medium transition-[background-color,opacity,transform] active:scale-[0.98] active:opacity-80 motion-reduce:transform-none motion-reduce:transition-none ${selected ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted"}`}
          >
            {student.name}
          </Link>
        )
      })}
    </nav>
  )
}
