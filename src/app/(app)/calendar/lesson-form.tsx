"use client"

import { useActionState, useState, useEffect } from "react"
import { toast } from "sonner"
import { createLesson } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { FormProgress } from "@/components/ui/form-progress"
import { FormMessage } from "@/components/ui/form-message"
import { PendingStatus } from "@/components/ui/pending-status"

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
    <div className="apple-card-surface rounded-2xl p-4 space-y-3 w-full">
      <h3 className="font-medium text-sm">授業を追加</h3>
      <form action={action} className="space-y-3">
        {state.error && <FormMessage type="error">{state.error} 日付・時刻・金額の入力を確認してください。</FormMessage>}
        <FormProgress />
        <PendingStatus pending={isPending} label="授業を追加しています" />

        <div className="space-y-1.5">
          <Label htmlFor="studentId" className="text-xs font-medium">生徒 <span className="text-destructive">必須</span></Label>
          {students.length === 1 ? (
            <>
              <input type="hidden" name="studentId" value={students[0].id} />
              <p className="text-sm py-2 px-3 rounded-md border bg-muted">{students[0].user.name}（{students[0].grade}）</p>
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
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 min-w-0">
            <Label htmlFor="date" className="text-xs font-medium">日付 <span className="text-destructive">必須</span></Label>
            <Input id="date" name="date" type="date" required defaultValue={defaultDate} className="md:h-9" />
          </div>
          <div className="space-y-1.5 min-w-0">
            <Label htmlFor="time" className="text-xs font-medium">時刻 <span className="text-destructive">必須</span></Label>
            <Input id="time" name="time" type="time" required defaultValue="16:00" className="md:h-9" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium">授業形式 <span className="text-destructive">必須</span></Label>
          <div className="flex gap-5 pt-0.5">
            <label className="flex min-h-11 items-center gap-1.5 text-sm cursor-pointer">
              <input type="radio" name="type" value="online" defaultChecked required className="accent-primary"
                onChange={() => setLessonType("online")} />
              オンライン
            </label>
            <label className="flex min-h-11 items-center gap-1.5 text-sm cursor-pointer">
              <input type="radio" name="type" value="offline" required className="accent-primary"
                onChange={() => setLessonType("offline")} />
              対面
            </label>
          </div>
        </div>

        <details className="group rounded-lg border bg-muted/30">
          <summary className="flex min-h-11 cursor-pointer list-none items-center px-3 text-sm font-medium text-muted-foreground hover:text-foreground [&::-webkit-details-marker]:hidden">
            詳細設定（時間・料金・科目・繰り返し）
          </summary>
          <div className="space-y-3 border-t p-3">
        <p className="text-xs leading-relaxed text-muted-foreground">時間・金額は半角数字で入力します。カンマ、単位、ハイフンは不要です。</p>

        <div className="space-y-1.5">
          <Label htmlFor="durationMin" className="text-xs font-medium">時間（分・任意）</Label>
          <Input
            id="durationMin"
            name="durationMin"
            type="number"
            min="1"
            value={duration}
            onChange={handleDurationChange}
            className="md:h-9"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="repeatWeeks" className="text-xs font-medium">繰り返し登録（任意）</Label>
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
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="hourlyRate" className="text-xs font-medium">時給（円・任意）</Label>
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
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="travelExpense" className="text-xs font-medium">交通費（円・任意）</Label>
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
          </div>
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
                    checked={selectedSubjectIds.includes(s.id)}
                    onChange={(e) =>
                      setSelectedSubjectIds((ids) =>
                        e.target.checked ? [...ids, s.id] : ids.filter((id) => id !== s.id)
                      )
                    }
                    className="accent-primary"
                  />
                  {s.name}
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="notes" className="text-xs font-medium">メモ（任意）</Label>
          <Input id="notes" name="notes" placeholder="事前メモ" className="md:h-9" />
        </div>
          </div>
        </details>

        <div className="flex gap-2 pt-1">
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? "追加中..." : "追加"}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => { setOpen(false); onClose?.() }}>
            キャンセル
          </Button>
        </div>
      </form>
    </div>
  )
}
