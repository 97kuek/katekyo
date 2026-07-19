"use client"

import { useActionState, useState } from "react"
import Link from "next/link"
import { createHomework } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { HomeworkCoreFields, HomeworkDescriptionField, SubjectCheckboxes } from "../homework-form-fields"
import { FormField } from "@/components/ui/form-field"
import { FormProgress } from "@/components/ui/form-progress"
import { FormMessage } from "@/components/ui/form-message"
import { PendingStatus } from "@/components/ui/pending-status"
import { ChoiceControl } from "@/components/ui/choice-control"
import { ChevronDown, Plus, SlidersHorizontal } from "lucide-react"

type Student = {
  id: string
  grade: string
  user: { name: string }
}

type Material = { id: string; name: string }
type Subject = { id: string; name: string }

const tomorrowISO = () => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export default function CreateHomeworkForm({
  students,
  materialsByStudent,
  subjects,
  defaultStudentId,
}: {
  students: Student[]
  materialsByStudent: Record<string, Material[]>
  subjects: Subject[]
  defaultStudentId?: string
}) {
  const [state, action, isPending] = useActionState(createHomework, { error: "" })
  const singleStudent = students.length === 1 ? students[0] : null
  const validDefaultStudentId = students.some((student) => student.id === defaultStudentId) ? defaultStudentId : undefined
  const [selectedStudentId, setSelectedStudentId] = useState(singleStudent?.id ?? validDefaultStudentId ?? "")

  const materials = selectedStudentId ? (materialsByStudent[selectedStudentId] ?? []) : []

  return (
    <form action={action} className="min-w-0 space-y-4">
      {state.error && <FormMessage type="error">{state.error} 該当する項目を確認して、もう一度保存してください。</FormMessage>}
      <FormProgress />
      <PendingStatus pending={isPending} label="宿題を作成しています" />
      <FormField htmlFor="studentId" label="生徒" required hint="宿題を割り当てる生徒を選びます。">
        {singleStudent ? (
              <>
                <input type="hidden" name="studentId" value={singleStudent.id} />
                <Input id="studentId" value={`${singleStudent.user.name}（${singleStudent.grade}）`} disabled />
              </>
        ) : (
          <Select
            id="studentId"
            name="studentId"
            required
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
          >
            <option value="">生徒を選択してください</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.user.name}（{s.grade}）
              </option>
            ))}
          </Select>
        )}
      </FormField>
      <HomeworkCoreFields mode="create" defaults={{ dueDate: tomorrowISO() }} includeDescription={false} />

      <details className="group min-w-0 rounded-xl border border-border/60 bg-muted/25">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3 text-sm font-medium text-muted-foreground hover:text-foreground [&::-webkit-details-marker]:hidden">
          <SlidersHorizontal className="size-4 shrink-0" aria-hidden />
          <span className="min-w-0 flex-1 truncate">補足設定</span>
          <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden />
        </summary>
        <div className="min-w-0 space-y-4 border-t border-border/60 p-3">
          <HomeworkDescriptionField mode="create" />
          {selectedStudentId && (
            <FormField htmlFor="materialId" label="使用教材" hint="登録済み教材を選ぶと、生徒がどの教材を使うか迷いません。">
              {materials.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  この生徒の教材が未登録です。
                  <Link href={`/students/${selectedStudentId}/materials`} className="ml-1 inline-flex min-h-11 items-center underline">
                    教材を登録する
                  </Link>
                </p>
              ) : (
                <Select id="materialId" name="materialId">
                  <option value="">指定しない</option>
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </Select>
              )}
            </FormField>
          )}
          <SubjectCheckboxes label="科目タグ（複数選択可）" subjects={subjects} />
          <ChoiceControl type="checkbox" name="requiresPhoto" id="requiresPhoto" value="1" label="写真提出を必須にする" />
        </div>
      </details>

      <div className="flex items-center justify-end border-t border-border/60 pt-3">
        <Button type="submit" size="sm" disabled={isPending}>
          <Plus aria-hidden />
          {isPending ? "作成中..." : "作成"}
        </Button>
      </div>
    </form>
  )
}
