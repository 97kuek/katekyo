"use client"

import { useActionState } from "react"
import { updateHomework } from "../actions"
import { Button } from "@/components/ui/button"
import { StickyFormActions } from "@/components/ui/sticky-form-actions"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { HomeworkCoreFields, SubjectCheckboxes } from "@/app/(app)/homework/homework-form-fields"

type Homework = {
  id: string
  title: string
  description: string | null
  dueDate: Date
  subjectIds: string[]
  student: { user: { name: string } }
}
type Subject = { id: string; name: string }

export default function EditHomeworkForm({
  homework,
  subjects,
}: {
  homework: Homework
  subjects: Subject[]
}) {
  const [state, action, isPending] = useActionState(updateHomework, { error: "" })

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={homework.id} />
      {state.error && (
        <p className="text-sm text-foreground border border-destructive/30 bg-destructive/10 p-3 rounded-md">{state.error}</p>
      )}
      <div className="space-y-2">
        <Label>生徒</Label>
        <Input value={homework.student.user.name} disabled className="bg-muted" />
      </div>
      <HomeworkCoreFields
        mode="edit"
        defaults={{
          title: homework.title,
          description: homework.description ?? "",
          dueDate: homework.dueDate.toISOString().split("T")[0],
        }}
      />
      <SubjectCheckboxes
        label="科目タグ（複数選択可）"
        subjects={subjects}
        defaultCheckedIds={homework.subjectIds}
      />
      <StickyFormActions>
        <Button type="submit" className="w-full md:w-auto" disabled={isPending}>
          {isPending ? "保存中..." : "変更を保存"}
        </Button>
      </StickyFormActions>
    </form>
  )
}
