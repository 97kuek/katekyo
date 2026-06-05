"use client"

import { useActionState } from "react"
import { updateHomework } from "../edit-actions"
import { Button } from "@/components/ui/button"
import { StickyFormActions } from "@/components/ui/sticky-form-actions"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

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
        <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{state.error}</p>
      )}
      <div className="space-y-2">
        <Label>生徒</Label>
        <Input value={homework.student.user.name} disabled className="bg-muted" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="title">タイトル</Label>
        <Input id="title" name="title" required defaultValue={homework.title} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">内容（任意）</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={homework.description ?? ""}
          className="resize-none"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="dueDate">期限</Label>
        <Input
          id="dueDate"
          name="dueDate"
          type="date"
          required
          defaultValue={homework.dueDate.toISOString().split("T")[0]}
        />
      </div>
      {subjects.length > 0 && (
        <div className="space-y-2">
          <Label>科目タグ（複数選択可）</Label>
          <div className="flex flex-wrap gap-3">
            {subjects.map((s) => (
              <label key={s.id} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  name="subjectIds"
                  value={s.id}
                  defaultChecked={homework.subjectIds.includes(s.id)}
                  className="accent-primary"
                />
                <span className="text-sm">{s.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}
      <StickyFormActions>
        <Button type="submit" className="w-full md:w-auto" disabled={isPending}>
          {isPending ? "保存中..." : "変更を保存"}
        </Button>
      </StickyFormActions>
    </form>
  )
}
