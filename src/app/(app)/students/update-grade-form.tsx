"use client"

import { useState } from "react"
import { updateStudentGrade } from "./[id]/actions"
import { GRADE_OPTIONS } from "@/lib/grades"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"

type Props = { studentId: string; currentGrade: string }

export function UpdateGradeForm({ studentId, currentGrade }: Props) {
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        size="xs"
        onClick={() => setOpen(true)}
      >
        学年変更
      </Button>
    )
  }

  return (
    <form
      action={async (fd) => {
        await updateStudentGrade(fd)
        setOpen(false)
      }}
      className="grid gap-2 sm:flex sm:items-center sm:gap-1"
    >
      <input type="hidden" name="studentId" value={studentId} />
      <Select
        name="grade"
        defaultValue={currentGrade}
        containerClassName="sm:w-auto"
        className="md:h-7 md:text-xs"
      >
        {GRADE_OPTIONS.map((g) => (
          <option key={g} value={g}>{g}</option>
        ))}
      </Select>
      <Button type="submit" size="sm" className="h-10 sm:h-8">
        保存
      </Button>
      <Button type="button" variant="outline" size="sm" className="h-10 sm:h-8" onClick={() => setOpen(false)}>
        キャンセル
      </Button>
    </form>
  )
}
