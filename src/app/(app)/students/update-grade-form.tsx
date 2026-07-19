"use client"

import { useState } from "react"
import { updateStudentGrade } from "./[id]/actions"
import { GRADE_OPTIONS } from "@/lib/grades"
import { Button, buttonVariants } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { PendingSubmitButton } from "@/components/ui/pending-submit-button"

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
      <div className="grid gap-1">
        <Label htmlFor={`grade-${studentId}`} className="text-xs">新しい学年（必須）</Label>
        <Select
          id={`grade-${studentId}`}
          name="grade"
          required
          defaultValue={currentGrade}
          containerClassName="sm:w-auto"
          className="md:h-7 md:text-xs"
        >
          {GRADE_OPTIONS.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </Select>
      </div>
      <PendingSubmitButton pendingLabel="保存中" className={buttonVariants({ size: "sm", className: "h-10 sm:h-8" })}>
        保存
      </PendingSubmitButton>
      <Button type="button" variant="outline" size="sm" className="h-10 sm:h-8" onClick={() => setOpen(false)}>
        キャンセル
      </Button>
    </form>
  )
}
