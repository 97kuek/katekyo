"use client"

import { useState } from "react"
import { updateStudentGrade } from "./[id]/actions"
import { GRADE_OPTIONS } from "@/lib/grades"
import { Button, buttonVariants } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { PendingSubmitButton } from "@/components/ui/pending-submit-button"
import { FormField } from "@/components/ui/form-field"
import { Pencil, Save, X } from "lucide-react"

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
        <Pencil aria-hidden />
        学年
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
      <FormField htmlFor={`grade-${studentId}`} label="新しい学年" required className="sm:w-auto">
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
      </FormField>
      <PendingSubmitButton pendingLabel="保存中" className={buttonVariants({ size: "sm", className: "h-10 sm:h-8" })}>
        <Save aria-hidden />
        保存
      </PendingSubmitButton>
      <Button type="button" variant="outline" size="sm" className="h-10 sm:h-8" onClick={() => setOpen(false)}>
        <X aria-hidden />
        キャンセル
      </Button>
    </form>
  )
}
