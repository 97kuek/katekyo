"use client"

import { useActionState, useState } from "react"
import { toast } from "sonner"
import { updateLesson } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FormProgress } from "@/components/ui/form-progress"
import { FormMessage } from "@/components/ui/form-message"
import { PendingStatus } from "@/components/ui/pending-status"

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
      {state.error && <FormMessage type="error">{state.error} 日付・時刻・金額の入力を確認してください。</FormMessage>}
      <FormProgress />
      <PendingStatus pending={isPending} label="授業の変更を保存しています" />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 min-w-0">
          <Label htmlFor={`lesson-date-${lesson.id}`} className="text-xs font-medium">日付 <span className="text-destructive">必須</span></Label>
          <Input id={`lesson-date-${lesson.id}`} name="date" type="date" required defaultValue={toDateStr(lesson.date)} className="md:h-9" />
        </div>
        <div className="space-y-1.5 min-w-0">
          <Label htmlFor={`lesson-time-${lesson.id}`} className="text-xs font-medium">時刻 <span className="text-destructive">必須</span></Label>
          <Input id={`lesson-time-${lesson.id}`} name="time" type="time" required defaultValue={toTimeStr(lesson.date)} className="md:h-9" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium">授業形式 <span className="text-destructive">必須</span></Label>
        <div className="flex gap-4 pt-0.5">
          <label className="flex min-h-11 items-center gap-1.5 text-sm cursor-pointer">
            <input type="radio" name="type" value="online" defaultChecked={lesson.type === "online"} required className="accent-primary"
              onChange={() => setLessonType("online")} />
            オンライン
          </label>
          <label className="flex min-h-11 items-center gap-1.5 text-sm cursor-pointer">
            <input type="radio" name="type" value="offline" defaultChecked={lesson.type === "offline"} required className="accent-primary"
              onChange={() => setLessonType("offline")} />
            対面
          </label>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">時間・金額は半角数字で入力します。カンマ、単位、ハイフンは不要です。</p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">時間（分・任意）</Label>
          <Input name="durationMin" type="number" min="1" defaultValue={lesson.durationMin ?? ""} className="md:h-9" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">時給（円・任意）</Label>
          <Input name="hourlyRate" type="number" min="0" defaultValue={lesson.hourlyRate ?? ""} className="md:h-9" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium">交通費（円・任意）</Label>
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
        <Label className="text-xs font-medium">メモ（任意）</Label>
        <Input name="notes" defaultValue={lesson.notes ?? ""} className="md:h-9" placeholder="事前メモ" />
      </div>

      {subjects.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">科目（任意・複数選択可）</Label>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {subjects.map((s) => (
              <label key={s.id} className="flex min-h-11 items-center gap-1.5 text-sm cursor-pointer">
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
        <Label className="text-xs font-medium">授業ログ（実施内容・次回目標・任意）</Label>
        <Textarea
          name="lessonLog"
          rows={3}
          defaultValue={lesson.lessonLog ?? ""}
          placeholder="今日の内容、宿題、次回の目標など"
          className="resize-none"
        />
        <label className="flex min-h-11 items-center gap-1.5 text-sm cursor-pointer text-muted-foreground">
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
