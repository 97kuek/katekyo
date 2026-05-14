"use client"

import { useActionState } from "react"
import { createHomework } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Student = {
  id: string
  grade: string
  user: { name: string }
}

export default function CreateHomeworkForm({ students }: { students: Student[] }) {
  const [state, action, isPending] = useActionState(createHomework, { error: "" })

  return (
    <form action={action} className="space-y-4">
      {state.error && (
        <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{state.error}</p>
      )}
      <div className="space-y-2">
        <Label htmlFor="studentId">生徒</Label>
        <select
          id="studentId"
          name="studentId"
          required
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">生徒を選択してください</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.user.name}（{s.grade}）
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="title">タイトル</Label>
        <Input id="title" name="title" required placeholder="例: 英単語50問" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">内容（任意）</Label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          placeholder="詳細な指示があれば入力してください"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="dueDate">期限</Label>
        <Input id="dueDate" name="dueDate" type="date" required />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "作成中..." : "宿題を作成する"}
      </Button>
    </form>
  )
}
