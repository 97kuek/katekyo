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
}

export function LessonForm({ students, defaultDate }: { students: Student[]; defaultDate: string }) {
  const [state, action, isPending] = useActionState(createLesson, { error: "" })
  const [open, setOpen] = useState(false)
  const [defaultDuration, setDefaultDuration] = useState("60")
  const [hourlyRate, setHourlyRate] = useState("")
  const [travelExpense, setTravelExpense] = useState("")
  const [lessonType, setLessonType] = useState<"online" | "offline">("online")

  useEffect(() => {
    const saved = localStorage.getItem(DURATION_KEY)
    if (saved) setDefaultDuration(saved)

    // 生徒が1人だけなら、その生徒のデフォルト料金で初期化
    if (students.length === 1) {
      const s = students[0]
      setHourlyRate(s.defaultHourlyRate != null ? String(s.defaultHourlyRate) : "")
      setTravelExpense(s.defaultTravelExpense != null ? String(s.defaultTravelExpense) : "")
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
  }

  function handleDurationChange(e: React.ChangeEvent<HTMLInputElement>) {
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
    <div className="rounded-lg border bg-white p-4 space-y-3">
      <h3 className="font-medium text-sm">授業を追加</h3>
      <form action={action} className="space-y-3">
        {state.error && (
          <p className="text-xs text-red-600 bg-red-50 p-2 rounded">{state.error}</p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1">
            <Label htmlFor="studentId" className="text-xs">生徒</Label>
            {students.length === 1 ? (
              <>
                <input type="hidden" name="studentId" value={students[0].id} />
                <p className="text-sm py-1.5 px-3 rounded-md border bg-gray-50">{students[0].user.name}（{students[0].grade}）</p>
              </>
            ) : (
              <select
                id="studentId"
                name="studentId"
                required
                onChange={handleStudentChange}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
          <div className="space-y-1">
            <Label htmlFor="durationMin" className="text-xs">時間（分）</Label>
            <Input
              id="durationMin"
              name="durationMin"
              type="number"
              min="1"
              defaultValue={defaultDuration}
              onChange={handleDurationChange}
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="repeatWeeks" className="text-xs">週次繰り返し</Label>
            <select
              id="repeatWeeks"
              name="repeatWeeks"
              defaultValue="0"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="0">繰り返しなし</option>
              {[1,2,3,4,5,6,7,8,9,10,11,12].map((w) => (
                <option key={w} value={w}>{w}週間（計{w+1}回）</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="hourlyRate" className="text-xs">時給（円・任意）</Label>
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
          <div className="space-y-1">
            <Label htmlFor="travelExpense" className="text-xs">交通費（円・任意）</Label>
            <Input
              id="travelExpense"
              name="travelExpense"
              type="number"
              min="0"
              placeholder={lessonType === "online" ? "0（自動）" : "500"}
              disabled={lessonType === "online"}
              value={lessonType === "online" ? "" : travelExpense}
              onChange={(e) => setTravelExpense(e.target.value)}
              className="h-9 text-sm disabled:bg-gray-50 disabled:text-muted-foreground"
            />
          </div>
          <div className="col-span-2 space-y-1">
            <Label htmlFor="notes" className="text-xs">メモ（任意）</Label>
            <Input id="notes" name="notes" placeholder="事前メモ" className="h-9 text-sm" />
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
