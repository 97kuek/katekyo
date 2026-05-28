"use client"

import { useState } from "react"
import { updateStudentGrade } from "./[id]/actions"
import { GRADE_OPTIONS } from "@/lib/grades"

type Props = { studentId: string; currentGrade: string }

export function UpdateGradeForm({ studentId, currentGrade }: Props) {
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-muted-foreground hover:text-foreground hover:underline"
      >
        学年変更
      </button>
    )
  }

  return (
    <form
      action={async (fd) => {
        await updateStudentGrade(fd)
        setOpen(false)
      }}
      className="flex items-center gap-1"
    >
      <input type="hidden" name="studentId" value={studentId} />
      <select
        name="grade"
        defaultValue={currentGrade}
        className="h-7 text-xs rounded border border-input bg-background px-1.5 focus:outline-none focus:ring-1 focus:ring-ring"
      >
        {GRADE_OPTIONS.map((g) => (
          <option key={g} value={g}>{g}</option>
        ))}
      </select>
      <button type="submit" className="text-xs text-primary hover:underline">保存</button>
      <button type="button" onClick={() => setOpen(false)} className="text-xs text-muted-foreground hover:underline">
        キャンセル
      </button>
    </form>
  )
}
