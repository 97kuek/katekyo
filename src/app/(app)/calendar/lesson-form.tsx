"use client"

import { useActionState, useState, useEffect } from "react"
import { toast } from "sonner"
import { createLesson } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { FormProgress } from "@/components/ui/form-progress"
import { FormMessage } from "@/components/ui/form-message"
import { PendingStatus } from "@/components/ui/pending-status"
import { FormField, FormFieldLabel } from "@/components/ui/form-field"
import { ChoiceControl } from "@/components/ui/choice-control"
import { ChevronDown, Plus, SlidersHorizontal, X } from "lucide-react"

const DURATION_KEY = "lesson_default_duration"

type Student = {
  id: string
  grade: string
  user: { name: string }
  defaultHourlyRate?: number | null
  defaultTravelExpense?: number | null
  defaultDurationMin?: number | null
  defaultSubjectIds?: string[] | null
}

type Subject = { id: string; name: string }

export function LessonForm({ students, defaultDate, subjects, embedded = false, onClose }: { students: Student[]; defaultDate: string; subjects: Subject[]; embedded?: boolean; onClose?: () => void }) {
  const [open, setOpen] = useState(embedded)
  const [state, action, isPending] = useActionState(
    async (prev: { error: string; timestamp?: number }, formData: FormData) => {
      const result = await createLesson(prev, formData)
      if (result.timestamp) {
        setOpen(false)
        onClose?.()
        toast.success("授業を追加しました")
      }
      return result
    },
    { error: "" }
  )
  const [studentId, setStudentId] = useState(students[0]?.id ?? "")
  const [duration, setDuration] = useState("60")
  const [hourlyRate, setHourlyRate] = useState("")
  const [travelExpense, setTravelExpense] = useState("")
  const [lessonType, setLessonType] = useState<"online" | "offline">("online")
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([])

  // 生徒のデフォルト（時給・交通費・授業時間・科目）をフォームに反映する。
  // null のデフォルトは前の生徒の値を引きずらないよう明示的にクリアする。
  function applyStudentDefaults(s: Student) {
    setHourlyRate(s.defaultHourlyRate != null ? String(s.defaultHourlyRate) : "")
    setTravelExpense(s.defaultTravelExpense != null ? String(s.defaultTravelExpense) : "")
    setSelectedSubjectIds(s.defaultSubjectIds ?? [])
    if (s.defaultDurationMin != null) {
      setDuration(String(s.defaultDurationMin))
    } else {
      const saved = localStorage.getItem(DURATION_KEY)
      if (saved) setDuration(saved)
    }
  }

  // 生徒数に関わらず、フォーム表示時は先頭の生徒のデフォルトを自動反映する。
  // localStorage（クライアント専用ストア）をハイドレーション後に読む必要があるため effect で行う。
  useEffect(() => {
    const first = students[0]
    if (first) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStudentId(first.id)
      applyStudentDefaults(first)
    } else {
      const saved = localStorage.getItem(DURATION_KEY)
       
      if (saved) setDuration(saved)
    }
     
  }, [students])

  function handleStudentChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setStudentId(e.target.value)
    const student = students.find((s) => s.id === e.target.value)
    if (student) applyStudentDefaults(student)
  }

  function handleDurationChange(e: React.ChangeEvent<HTMLInputElement>) {
    setDuration(e.target.value)
    localStorage.setItem(DURATION_KEY, e.target.value)
  }

  if (!open && !embedded) {
    return (
      <Button onClick={() => setOpen(true)} size="sm">
        授業を追加
      </Button>
    )
  }

  if (!open) return null

  return (
    <section className="w-full min-w-0 rounded-xl border border-border/60 bg-background/70 p-3">
      <div className="mb-3 flex min-w-0 items-center justify-between gap-2">
        <h3 className="truncate text-sm font-semibold">授業を追加</h3>
        <Button type="button" variant="ghost" size="icon-xs" aria-label="授業登録を閉じる" onClick={() => { setOpen(false); onClose?.() }}>
          <X aria-hidden />
        </Button>
      </div>
      <form action={action} className="space-y-3">
        {state.error && <FormMessage type="error">{state.error} 日付・時刻・金額の入力を確認してください。</FormMessage>}
        <FormProgress />
        <PendingStatus pending={isPending} label="授業を追加しています" />

        <FormField htmlFor="studentId" label="生徒" required>
          {students.length === 1 ? (
              <>
                <input type="hidden" name="studentId" value={students[0].id} />
                <Input id="studentId" value={`${students[0].user.name}（${students[0].grade}）`} disabled />
              </>
          ) : (
            <Select
              id="studentId"
              name="studentId"
              required
              value={studentId}
              onChange={handleStudentChange}
              className="md:h-9"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.user.name}（{s.grade}）
                </option>
              ))}
            </Select>
          )}
        </FormField>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField htmlFor="date" label="日付" required>
            <Input id="date" name="date" type="date" required defaultValue={defaultDate} className="md:h-9" />
          </FormField>
          <FormField htmlFor="time" label="時刻" required>
            <Input id="time" name="time" type="time" required defaultValue="16:00" className="md:h-9" />
          </FormField>
        </div>

        <div className="space-y-1.5">
          <FormFieldLabel label="授業形式" required />
          <div className="flex flex-wrap gap-2 pt-0.5">
            <ChoiceControl type="radio" name="type" value="online" defaultChecked required onChange={() => setLessonType("online")} label="オンライン" />
            <ChoiceControl type="radio" name="type" value="offline" required onChange={() => setLessonType("offline")} label="対面" />
          </div>
        </div>

        <details className="group min-w-0 rounded-xl border border-border/60 bg-muted/25">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3 text-sm font-medium text-muted-foreground hover:text-foreground [&::-webkit-details-marker]:hidden">
            <SlidersHorizontal className="size-4 shrink-0" aria-hidden />
            <span className="min-w-0 flex-1 truncate">詳細設定</span>
            <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden />
          </summary>
          <div className="min-w-0 space-y-3 border-t border-border/60 p-3">
        <p className="text-xs leading-relaxed text-muted-foreground">時間・料金・科目・繰り返しを必要な場合だけ設定できます。数値は半角、カンマ・単位・ハイフンなしで入力してください。</p>

        <FormField htmlFor="durationMin" label="時間（分）" hint="半角数字で入力します。単位は不要です。">
          <Input
            id="durationMin"
            name="durationMin"
            type="number"
            min="1"
            value={duration}
            onChange={handleDurationChange}
            className="md:h-9"
          />
        </FormField>

        <FormField htmlFor="repeatWeeks" label="繰り返し登録">
          <Select
            id="repeatWeeks"
            name="repeatWeeks"
            defaultValue="0"
            className="md:h-9"
          >
            <option value="0">繰り返さない（1回のみ）</option>
            {[1,2,3,4,5,6,7,8,9,10,11,12].map((w) => (
              <option key={w} value={w}>計{w+1}回（今日 + {w}週後まで）</option>
            ))}
          </Select>
        </FormField>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField htmlFor="hourlyRate" label="時給（円）" hint="半角数字のみ。カンマ・円記号は不要です。">
            <Input
              id="hourlyRate"
              name="hourlyRate"
              type="number"
              min="0"
              placeholder="3000"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              className="md:h-9"
            />
          </FormField>
          <FormField htmlFor="travelExpense" label="交通費（円）" hint="オンライン授業では0円になります。">
            <Input
              id="travelExpense"
              name="travelExpense"
              type="number"
              min="0"
              placeholder={lessonType === "online" ? "0（自動）" : "500"}
              disabled={lessonType === "online"}
              value={lessonType === "online" ? "" : travelExpense}
              onChange={(e) => setTravelExpense(e.target.value)}
              className="md:h-9 disabled:bg-muted disabled:text-muted-foreground"
            />
          </FormField>
        </div>

        {subjects.length > 0 && (
          <div className="space-y-1.5">
            <FormFieldLabel label="科目（複数選択可）" />
            <div className="flex flex-wrap gap-2">
              {subjects.map((s) => (
                <ChoiceControl
                  key={s.id}
                  type="checkbox"
                  name="subjectIds"
                  value={s.id}
                  checked={selectedSubjectIds.includes(s.id)}
                  onChange={(e) => setSelectedSubjectIds((ids) => e.target.checked ? [...ids, s.id] : ids.filter((id) => id !== s.id))}
                  label={s.name}
                />
              ))}
            </div>
          </div>
        )}

        <FormField htmlFor="notes" label="メモ" hint="授業前に確認したい内容を入力します。">
          <Input id="notes" name="notes" placeholder="事前メモ" className="md:h-9" />
        </FormField>
          </div>
        </details>

        <div className="flex items-center justify-end gap-1.5 border-t border-border/60 pt-3">
          <Button type="button" variant="ghost" size="sm" onClick={() => { setOpen(false); onClose?.() }}>
            キャンセル
          </Button>
          <Button type="submit" size="sm" disabled={isPending}>
            <Plus aria-hidden />
            {isPending ? "追加中..." : "追加"}
          </Button>
        </div>
      </form>
    </section>
  )
}
