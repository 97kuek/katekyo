"use client"

import { useActionState, useEffect, useState } from "react"
import { toast } from "sonner"
import { updateLesson } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Lesson = {
  id: string
  date: Date
  type: "online" | "offline"
  durationMin: number | null
  notes: string | null
  lessonLog: string | null
  hourlyRate: number | null
  travelExpense: number | null
}

function toDateStr(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}
function toTimeStr(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

export function LessonEditForm({ lesson, onClose }: { lesson: Lesson; onClose: () => void }) {
  const [state, action, isPending] = useActionState(updateLesson, { error: "" })
  const [lessonType, setLessonType] = useState<"online" | "offline">(lesson.type)

  useEffect(() => {
    if (!state.timestamp) return
    onClose()
    toast.success("授業を更新しました")
  }, [state.timestamp])

  return (
    <form action={action} className="mt-2 space-y-2 border-t pt-2">
      <input type="hidden" name="lessonId" value={lesson.id} />
      {state.error && (
        <p className="text-xs text-red-600 bg-red-50 p-1.5 rounded">{state.error}</p>
      )}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">日付</Label>
          <Input name="date" type="date" required defaultValue={toDateStr(lesson.date)} className="h-8 text-xs" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">時刻</Label>
          <Input name="time" type="time" required defaultValue={toTimeStr(lesson.date)} className="h-8 text-xs" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">形式</Label>
          <div className="flex gap-3 pt-1">
            <label className="flex items-center gap-1 text-xs cursor-pointer">
              <input type="radio" name="type" value="online" defaultChecked={lesson.type === "online"} className="accent-primary"
                onChange={() => setLessonType("online")} />
              オンライン
            </label>
            <label className="flex items-center gap-1 text-xs cursor-pointer">
              <input type="radio" name="type" value="offline" defaultChecked={lesson.type === "offline"} className="accent-primary"
                onChange={() => setLessonType("offline")} />
              対面
            </label>
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">時間（分）</Label>
          <Input name="durationMin" type="number" min="1" defaultValue={lesson.durationMin ?? ""} className="h-8 text-xs" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">時給（円）</Label>
          <Input name="hourlyRate" type="number" min="0" defaultValue={lesson.hourlyRate ?? ""} className="h-8 text-xs" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">交通費（円）</Label>
          <Input name="travelExpense" type="number" min="0"
            defaultValue={lessonType === "online" ? 0 : (lesson.travelExpense ?? "")}
            disabled={lessonType === "online"}
            className="h-8 text-xs disabled:bg-gray-50" />
        </div>
        <div className="col-span-2 space-y-1">
          <Label className="text-xs">メモ</Label>
          <Input name="notes" defaultValue={lesson.notes ?? ""} className="h-8 text-xs" />
        </div>
        <div className="col-span-2 space-y-1">
          <Label className="text-xs">授業ログ（実施内容・次回目標）</Label>
          <textarea
            name="lessonLog"
            rows={3}
            defaultValue={lesson.lessonLog ?? ""}
            placeholder="今日の内容、宿題、次回の目標など"
            className="flex w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" className="h-7 text-xs" disabled={isPending}>
          {isPending ? "保存中..." : "保存"}
        </Button>
        <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={onClose}>
          キャンセル
        </Button>
      </div>
    </form>
  )
}
