"use client"

import { useActionState, useState, useEffect } from "react"
import { toast } from "sonner"
import { createLesson } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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

export function LessonForm({ students, defaultDate, subjects }: { students: Student[]; defaultDate: string; subjects: Subject[] }) {
  const [state, action, isPending] = useActionState(createLesson, { error: "" })
  const [open, setOpen] = useState(false)
  const [duration, setDuration] = useState("60")
  const [hourlyRate, setHourlyRate] = useState("")
  const [travelExpense, setTravelExpense] = useState("")
  const [lessonType, setLessonType] = useState<"online" | "offline">("online")
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([])

  useEffect(() => {
    const saved = localStorage.getItem(DURATION_KEY)
    if (students.length === 1) {
      const s = students[0]
      setHourlyRate(s.defaultHourlyRate != null ? String(s.defaultHourlyRate) : "")
      setTravelExpense(s.defaultTravelExpense != null ? String(s.defaultTravelExpense) : "")
      setSelectedSubjectIds(s.defaultSubjectIds ?? [])
      if (s.defaultDurationMin != null) {
        setDuration(String(s.defaultDurationMin))
      } else if (saved) {
        setDuration(saved)
      }
    } else if (saved) {
      setDuration(saved)
    }
  }, [students])

  useEffect(() => {
    if (!state.timestamp) return
    setOpen(false)
    toast.success("授業を追加しました")
  }, [state.timestamp])

  function handleStudentChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const student = students.find((s) => s.id === e.target.value)
    if (!student) return
    if (student.defaultHourlyRate != null) setHourlyRate(String(student.defaultHourlyRate))
    if (student.defaultTravelExpense != null) setTravelExpense(String(student.defaultTravelExpense))
    setSelectedSubjectIds(student.defaultSubjectIds ?? [])
    if (student.defaultDurationMin != null) {
      setDuration(String(student.defaultDurationMin))
    }
  }

  function handleDurationChange(e: React.ChangeEvent<HTMLInputElement>) {
    setDuration(e.target.value)
    localStorage.setItem(DURATION_KEY, e.target.value)
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size="sm">
        授業を追加
      </Button>
    )
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3 w-full">
      <h3 className="font-medium text-sm">授業を追加</h3>
      <form action={action} className="space-y-3">
        {state.error && (
          <p className="text-xs text-destructive bg-destructive/10 p-2 rounded">{state.error}</p>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="studentId" className="text-xs font-medium">生徒</Label>
          {students.length === 1 ? (
            <>
              <input type="hidden" name="studentId" value={students[0].id} />
              <p className="text-sm py-2 px-3 rounded-md border bg-muted">{students[0].user.name}（{students[0].grade}）</p>
            </>
          ) : (
            <select
              id="studentId"
              name="studentId"
              required
              onChange={handleStudentChange}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">選択してください</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.user.name}（{s.grade}）
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5 min-w-0">
            <Label htmlFor="date" className="text-xs font-medium">日付</Label>
            <Input id="date" name="date" type="date" required defaultValue={defaultDate} className="h-9 text-sm" />
          </div>
          <div className="space-y-1.5 min-w-0">
            <Label htmlFor="time" className="text-xs font-medium">時刻</Label>
            <Input id="time" name="time" type="time" required defaultValue="16:00" className="h-9 text-sm" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium">授業形式</Label>
          <div className="flex gap-5 pt-0.5">
            <label className="flex items-center gap-1.5 text-sm cursor-pointer">
              <input type="radio" name="type" value="online" defaultChecked className="accent-primary"
                onChange={() => setLessonType("online")} />
              オンライン
            </label>
            <label className="flex items-center gap-1.5 text-sm cursor-pointer">
              <input type="radio" name="type" value="offline" className="accent-primary"
                onChange={() => setLessonType("offline")} />
              対面
            </label>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="durationMin" className="text-xs font-medium">時間（分）</Label>
          <Input
            id="durationMin"
            name="durationMin"
            type="number"
            min="1"
            value={duration}
            onChange={handleDurationChange}
            className="h-9 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="repeatWeeks" className="text-xs font-medium">繰り返し登録</Label>
          <select
            id="repeatWeeks"
            name="repeatWeeks"
            defaultValue="0"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="0">繰り返さない（1回のみ）</option>
            {[1,2,3,4,5,6,7,8,9,10,11,12].map((w) => (
              <option key={w} value={w}>計{w+1}回（今日 + {w}週後まで）</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
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
              className="h-9 text-sm"
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
              className="h-9 text-sm disabled:bg-muted disabled:text-muted-foreground"
            />
          </div>
        </div>

        {subjects.length > 0 && (
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">科目（任意）</Label>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              {subjects.map((s) => (
                <label key={s.id} className="flex items-center gap-1.5 text-sm cursor-pointer">
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
          <Input id="notes" name="notes" placeholder="事前メモ" className="h-9 text-sm" />
        </div>

        <div className="flex gap-2 pt-1">
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
