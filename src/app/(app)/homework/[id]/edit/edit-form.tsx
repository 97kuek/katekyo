"use client"

import { useActionState } from "react"
import { updateHomework } from "../actions"
import { Button } from "@/components/ui/button"
import { StickyFormActions } from "@/components/ui/sticky-form-actions"
import { Input } from "@/components/ui/input"
import { HomeworkCoreFields, SubjectCheckboxes } from "@/app/(app)/homework/homework-form-fields"
import { FormProgress } from "@/components/ui/form-progress"
import { FormMessage } from "@/components/ui/form-message"
import { PendingStatus } from "@/components/ui/pending-status"
import { Save } from "lucide-react"
import { FormField } from "@/components/ui/form-field"

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
      {state.error && <FormMessage type="error">{state.error} 該当する項目を確認して、もう一度保存してください。</FormMessage>}
      <FormProgress />
      <PendingStatus pending={isPending} label="宿題の変更を保存しています" />
      <FormField htmlFor="homework-student" label="生徒">
        <Input id="homework-student" value={homework.student.user.name} disabled className="bg-muted" />
      </FormField>
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
          <Save aria-hidden />
          {isPending ? "保存中..." : "変更を保存"}
        </Button>
      </StickyFormActions>
    </form>
  )
}
