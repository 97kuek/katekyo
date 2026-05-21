"use client"

import { useActionState, useState } from "react"
import { createHomework } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

type Student = {
  id: string
  grade: string
  user: { name: string }
}

type Material = { id: string; name: string }

const tomorrowISO = () => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export default function CreateHomeworkForm({
  students,
  materialsByStudent,
}: {
  students: Student[]
  materialsByStudent: Record<string, Material[]>
}) {
  const [state, action, isPending] = useActionState(createHomework, { error: "" })
  const singleStudent = students.length === 1 ? students[0] : null
  const [selectedStudentId, setSelectedStudentId] = useState(singleStudent?.id ?? "")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")

  const materials = selectedStudentId ? (materialsByStudent[selectedStudentId] ?? []) : []

  return (
    <form action={action} className="space-y-4">
      {state.error && (
        <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{state.error}</p>
      )}
      <p className="text-xs text-muted-foreground"><span className="text-destructive font-medium">*</span> は必須項目です</p>
      <div className="space-y-2">
        <Label htmlFor="studentId">生徒 <span className="text-destructive">*</span></Label>
        {singleStudent ? (
          <>
            <input type="hidden" name="studentId" value={singleStudent.id} />
            <p className="text-sm py-2 px-3 rounded-md border bg-gray-50">{singleStudent.user.name}（{singleStudent.grade}）</p>
          </>
        ) : (
          <select
            id="studentId"
            name="studentId"
            required
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">生徒を選択してください</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.user.name}（{s.grade}）
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="title">タイトル <span className="text-destructive">*</span></Label>
        <Input id="title" name="title" required placeholder="例: 英単語50問" autoFocus
          value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">内容（任意）</Label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          placeholder="詳細な指示があれば入力してください"
          value={description} onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="dueDate">期限 <span className="text-destructive">*</span></Label>
        <Input id="dueDate" name="dueDate" type="date" required defaultValue={tomorrowISO()} />
      </div>
      {selectedStudentId && (
        <div className="space-y-2">
          <Label htmlFor="materialId">使用教材（任意）</Label>
          {materials.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              この生徒の教材が未登録です。
              <a href={`/students/${selectedStudentId}/materials`} className="underline ml-1">
                教材を登録する
              </a>
            </p>
          ) : (
            <select
              id="materialId"
              name="materialId"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">指定しない</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}
      <Button type="submit" disabled={isPending}>
        {isPending ? "作成中..." : "宿題を作成する"}
      </Button>
    </form>
  )
}
