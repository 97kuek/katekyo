"use client"

import { useActionState, useState } from "react"
import { toast } from "sonner"
import { updateLesson } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type Subject = { id: string; name: string }

type Lesson = {
  id: string
  date: Date
  type: "online" | "offline"
  durationMin: number | null
  notes: string | null
  lessonLog: string | null
  lessonLogPublic: boolean
  subjectIds: string[]
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

export function LessonEditForm({ lesson, onClose, subjects }: { lesson: Lesson; onClose: () => void; subjects: Subject[] }) {
  const [lessonType, setLessonType] = useState<"online" | "offline">(lesson.type)
  const [state, action, isPending] = useActionState(
    async (prev: { error: string; timestamp?: number }, formData: FormData) => {
      const result = await updateLesson(prev, formData)
      if (result.timestamp) {
        onClose()
        toast.success("授業を更新しました")
      }
      return result
    },
    { error: "" }
  )

  return (
    <form action={action} className="mt-3 space-y-3 border-t pt-3">
      <input type="hidden" name="lessonId" value={lesson.id} />
      {state.error && (
        <p className="text-xs text-foreground border border-destructive/30 bg-destructive/10 p-2 rounded">{state.error}</p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 min-w-0">
          <Label className="text-xs font-medium">日付</Label>
          <Input name="date" type="date" required defaultValue={toDateStr(lesson.date)} className="md:h-9" />
        </div>
        <div className="space-y-1.5 min-w-0">
          <Label className="text-xs font-medium">時刻</Label>
          <Input name="time" type="time" required defaultValue={toTimeStr(lesson.date)} className="md:h-9" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium">授業形式</Label>
        <div className="flex gap-4 pt-0.5">
          <label className="flex items-center gap-1.5 text-sm cursor-pointer">
            <input type="radio" name="type" value="online" defaultChecked={lesson.type === "online"} className="accent-primary"
              onChange={() => setLessonType("online")} />
            オンライン
          </label>
          <label className="flex items-center gap-1.5 text-sm cursor-pointer">
            <input type="radio" name="type" value="offline" defaultChecked={lesson.type === "offline"} className="accent-primary"
              onChange={() => setLessonType("offline")} />
            対面
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">時間（分）</Label>
          <Input name="durationMin" type="number" min="1" defaultValue={lesson.durationMin ?? ""} className="md:h-9" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">時給（円）</Label>
          <Input name="hourlyRate" type="number" min="0" defaultValue={lesson.hourlyRate ?? ""} className="md:h-9" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium">交通費（円）</Label>
        <Input
          name="travelExpense"
          type="number"
          min="0"
          defaultValue={lessonType === "online" ? 0 : (lesson.travelExpense ?? "")}
          disabled={lessonType === "online"}
          className="md:h-9 disabled:bg-muted disabled:text-muted-foreground"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium">メモ</Label>
        <Input name="notes" defaultValue={lesson.notes ?? ""} className="md:h-9" placeholder="事前メモ" />
      </div>

      {subjects.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">科目</Label>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {subjects.map((s) => (
              <label key={s.id} className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  name="subjectIds"
                  value={s.id}
                  defaultChecked={lesson.subjectIds.includes(s.id)}
                  className="accent-primary"
                />
                {s.name}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <Label className="text-xs font-medium">授業ログ（実施内容・次回目標）</Label>
        <Textarea
          name="lessonLog"
          rows={3}
          defaultValue={lesson.lessonLog ?? ""}
          placeholder="今日の内容、宿題、次回の目標など"
          className="resize-none"
        />
        <label className="flex items-center gap-1.5 text-sm cursor-pointer text-muted-foreground">
          <input
            type="checkbox"
            name="lessonLogPublic"
            defaultChecked={lesson.lessonLogPublic}
            className="accent-primary"
          />
          生徒に公開する
        </label>
      </div>

      <div className="grid gap-2 pt-1 sm:flex">
        <Button type="submit" size="sm" disabled={isPending} className="h-10 sm:h-8">
          {isPending ? "保存中..." : "保存"}
        </Button>
        <Button type="button" variant="outline" size="sm" className="h-10 sm:h-8" onClick={onClose}>
          キャンセル
        </Button>
      </div>
    </form>
  )
}
