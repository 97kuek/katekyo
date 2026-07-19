"use client"

import { useActionState, useState } from "react"
import { toast } from "sonner"
import { updateLesson } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { FormProgress } from "@/components/ui/form-progress"
import { FormMessage } from "@/components/ui/form-message"
import { PendingStatus } from "@/components/ui/pending-status"
import { FormField, FormFieldLabel } from "@/components/ui/form-field"
import { ChoiceControl } from "@/components/ui/choice-control"
import { Save, X } from "lucide-react"

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
        <FormField htmlFor={`lesson-date-${lesson.id}`} label="日付" required>
          <Input id={`lesson-date-${lesson.id}`} name="date" type="date" required defaultValue={toDateStr(lesson.date)} className="md:h-9" />
        </FormField>
        <FormField htmlFor={`lesson-time-${lesson.id}`} label="時刻" required>
          <Input id={`lesson-time-${lesson.id}`} name="time" type="time" required defaultValue={toTimeStr(lesson.date)} className="md:h-9" />
        </FormField>
      </div>

      <div className="space-y-1.5">
        <FormFieldLabel label="授業形式" required />
        <div className="flex flex-wrap gap-2 pt-0.5">
          <ChoiceControl type="radio" name="type" value="online" defaultChecked={lesson.type === "online"} required onChange={() => setLessonType("online")} label="オンライン" />
          <ChoiceControl type="radio" name="type" value="offline" defaultChecked={lesson.type === "offline"} required onChange={() => setLessonType("offline")} label="対面" />
        </div>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">時間・金額は半角数字で入力します。カンマ、単位、ハイフンは不要です。</p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField htmlFor={`lesson-duration-${lesson.id}`} label="時間（分）" hint="半角数字のみ。単位は不要です。">
          <Input id={`lesson-duration-${lesson.id}`} name="durationMin" type="number" min="1" defaultValue={lesson.durationMin ?? ""} className="md:h-9" />
        </FormField>
        <FormField htmlFor={`lesson-rate-${lesson.id}`} label="時給（円）" hint="半角数字のみ。カンマ・円記号は不要です。">
          <Input id={`lesson-rate-${lesson.id}`} name="hourlyRate" type="number" min="0" defaultValue={lesson.hourlyRate ?? ""} className="md:h-9" />
        </FormField>
      </div>

      <FormField htmlFor={`lesson-travel-${lesson.id}`} label="交通費（円）" hint="オンライン授業では0円になります。">
        <Input
          id={`lesson-travel-${lesson.id}`}
          name="travelExpense"
          type="number"
          min="0"
          defaultValue={lessonType === "online" ? 0 : (lesson.travelExpense ?? "")}
          disabled={lessonType === "online"}
          className="md:h-9 disabled:bg-muted disabled:text-muted-foreground"
        />
      </FormField>

      <FormField htmlFor={`lesson-notes-${lesson.id}`} label="メモ" hint="授業前に確認したい内容を入力します。">
        <Input id={`lesson-notes-${lesson.id}`} name="notes" defaultValue={lesson.notes ?? ""} className="md:h-9" placeholder="事前メモ" />
      </FormField>

      {subjects.length > 0 && (
        <div className="space-y-1.5">
          <FormFieldLabel label="科目（複数選択可）" />
          <div className="flex flex-wrap gap-2">
            {subjects.map((s) => (
              <ChoiceControl key={s.id} type="checkbox" name="subjectIds" value={s.id} defaultChecked={lesson.subjectIds.includes(s.id)} label={s.name} />
            ))}
          </div>
        </div>
      )}

      <FormField htmlFor={`lesson-log-${lesson.id}`} label="授業ログ" hint="実施内容と次回の目標を入力します。">
        <Textarea
          id={`lesson-log-${lesson.id}`}
          name="lessonLog"
          rows={3}
          defaultValue={lesson.lessonLog ?? ""}
          placeholder="今日の内容、宿題、次回の目標など"
          className="resize-none"
        />
        <ChoiceControl type="checkbox" name="lessonLogPublic" defaultChecked={lesson.lessonLogPublic} label="生徒に公開する" />
      </FormField>

      <div className="grid gap-2 pt-1 sm:flex">
        <Button type="submit" size="sm" disabled={isPending} className="h-10 sm:h-8">
          <Save aria-hidden />
          {isPending ? "保存中..." : "保存"}
        </Button>
        <Button type="button" variant="outline" size="sm" className="h-10 sm:h-8" onClick={onClose}>
          <X aria-hidden />
          キャンセル
        </Button>
      </div>
    </form>
  )
}
