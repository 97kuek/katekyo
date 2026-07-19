"use client"

import { useActionState, useState } from "react"
import Link from "next/link"
import { createHomework } from "./actions"
import { Button } from "@/components/ui/button"
import { StickyFormActions } from "@/components/ui/sticky-form-actions"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { HomeworkCoreFields, SubjectCheckboxes } from "../homework-form-fields"

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
    <form action={action} className="space-y-4">
      {state.error && (
        <p className="text-sm text-foreground border border-destructive/30 bg-destructive/10 p-3 rounded-md">{state.error}</p>
      )}
      <p className="text-xs text-muted-foreground"><span className="text-destructive font-medium">*</span> は必須項目です</p>
      <div className="space-y-2">
        <Label htmlFor="studentId">生徒 <span className="text-destructive">*</span></Label>
        {singleStudent ? (
          <>
            <input type="hidden" name="studentId" value={singleStudent.id} />
            <p className="text-sm py-2 px-3 rounded-md border bg-muted">{singleStudent.user.name}（{singleStudent.grade}）</p>
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
      </div>
      <HomeworkCoreFields mode="create" defaults={{ dueDate: tomorrowISO() }} />
      {selectedStudentId && (
        <div className="space-y-2">
          <Label htmlFor="materialId">使用教材（任意）</Label>
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
        </div>
      )}
      <SubjectCheckboxes label="科目タグ（任意・複数選択可）" subjects={subjects} />
      <div className="flex min-h-11 items-center gap-2">
        <input type="checkbox" name="requiresPhoto" id="requiresPhoto" value="1" className="accent-primary" />
        <Label htmlFor="requiresPhoto" className="text-sm font-normal cursor-pointer">
          写真提出を必須にする
        </Label>
      </div>
      <StickyFormActions>
        <Button type="submit" className="w-full md:w-auto" disabled={isPending}>
          {isPending ? "作成中..." : "宿題を作成する"}
        </Button>
      </StickyFormActions>
    </form>
  )
}
