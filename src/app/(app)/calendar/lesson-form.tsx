"use client"

import { useActionState, useState, useEffect } from "react"
import { toast } from "sonner"
import { createLesson } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Student = { id: string; grade: string; user: { name: string } }

export function LessonForm({ students, defaultDate }: { students: Student[]; defaultDate: string }) {
  const [state, action, isPending] = useActionState(createLesson, { error: "" })
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!state.timestamp) return
    setOpen(false)
    toast.success("授業を追加しました")
  }, [state.timestamp])

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size="sm">
        授業を追加
      </Button>
    )
  }

  return (
    <div className="rounded-lg border bg-white p-4 space-y-3">
      <h3 className="font-medium text-sm">授業を追加</h3>
      <form action={action} className="space-y-3">
        {state.error && (
          <p className="text-xs text-red-600 bg-red-50 p-2 rounded">{state.error}</p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1">
            <Label htmlFor="studentId" className="text-xs">生徒</Label>
            <select
              id="studentId"
              name="studentId"
              required
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">選択してください</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.user.name}（{s.grade}）
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="date" className="text-xs">日付</Label>
            <Input id="date" name="date" type="date" required defaultValue={defaultDate} className="h-9 text-sm" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="time" className="text-xs">時刻</Label>
            <Input id="time" name="time" type="time" required defaultValue="16:00" className="h-9 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">授業形式</Label>
            <div className="flex gap-4 pt-1">
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input type="radio" name="type" value="online" defaultChecked className="accent-primary" />
                オンライン
              </label>
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input type="radio" name="type" value="offline" className="accent-primary" />
                対面
              </label>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="durationMin" className="text-xs">時間（分）</Label>
            <Input id="durationMin" name="durationMin" type="number" min="1" placeholder="60" className="h-9 text-sm" />
          </div>
          <div className="col-span-2 space-y-1">
            <Label htmlFor="notes" className="text-xs">メモ（任意）</Label>
            <Input id="notes" name="notes" placeholder="授業内容など" className="h-9 text-sm" />
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? "追加中..." : "追加"}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
            キャンセル
          </Button>
        </div>
      </form>
    </div>
  )
}
