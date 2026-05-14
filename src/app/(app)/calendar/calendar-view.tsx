"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LessonForm } from "./lesson-form"
import { deleteLesson } from "./actions"

type Lesson = {
  id: string
  date: Date
  type: "online" | "offline"
  durationMin: number | null
  notes: string | null
  student: { user: { name: string } }
}

type HomeworkDeadline = {
  id: string
  title: string
  dueDate: Date
  studentName: string
}

type Student = { id: string; grade: string; user: { name: string } }

type Props = {
  lessons: Lesson[]
  deadlines: HomeworkDeadline[]
  students: Student[]
  isTeacher: boolean
}

function pad(n: number) { return String(n).padStart(2, "0") }

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export default function CalendarView({ lessons, deadlines, students, isTeacher }: Props) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<string | null>(toDateKey(today))

  const lessonMap = new Map<string, Lesson[]>()
  for (const l of lessons) {
    const key = toDateKey(l.date)
    if (!lessonMap.has(key)) lessonMap.set(key, [])
    lessonMap.get(key)!.push(l)
  }

  const deadlineMap = new Map<string, HomeworkDeadline[]>()
  for (const d of deadlines) {
    const key = toDateKey(d.dueDate)
    if (!deadlineMap.has(key)) deadlineMap.set(key, [])
    deadlineMap.get(key)!.push(d)
  }

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  while (cells.length % 7 !== 0) cells.push(null)

  const todayKey = toDateKey(today)
  const selectedLessons = selectedDay ? (lessonMap.get(selectedDay) ?? []) : []
  const selectedDeadlines = selectedDay ? (deadlineMap.get(selectedDay) ?? []) : []

  const selectedDateStr = selectedDay
    ? new Date(selectedDay + "T00:00:00").toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short" })
    : ""

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-white overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-semibold text-sm">
            {year}年 {month + 1}月
          </span>
          <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 text-center">
          {["日", "月", "火", "水", "木", "金", "土"].map((d, i) => (
            <div key={d} className={`py-2 text-xs font-medium ${i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-muted-foreground"}`}>
              {d}
            </div>
          ))}

          {cells.map((day, i) => {
            if (day === null) return <div key={i} className="aspect-square" />
            const key = `${year}-${pad(month + 1)}-${pad(day)}`
            const hasLesson = lessonMap.has(key)
            const hasDeadline = deadlineMap.has(key)
            const isToday = key === todayKey
            const isSelected = key === selectedDay
            const dow = (firstDay + day - 1) % 7

            return (
              <button
                key={key}
                onClick={() => setSelectedDay(key)}
                className={`aspect-square flex flex-col items-center justify-start pt-1.5 gap-0.5 text-xs transition-colors
                  ${isSelected ? "bg-primary/10" : "hover:bg-gray-50"}
                  ${dow === 0 ? "text-red-500" : dow === 6 ? "text-blue-500" : ""}
                `}
              >
                <span className={`h-6 w-6 flex items-center justify-center rounded-full font-medium
                  ${isToday ? "bg-primary text-primary-foreground" : ""}
                `}>
                  {day}
                </span>
                <div className="flex gap-0.5">
                  {hasLesson && <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />}
                  {hasDeadline && <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />}
                </div>
              </button>
            )
          })}
        </div>

        <div className="px-3 pb-3 pt-1 flex items-center gap-4 text-xs text-muted-foreground border-t">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-400 inline-block" />授業</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-orange-400 inline-block" />宿題期限</span>
        </div>
      </div>

      {selectedDay && (
        <div className="rounded-lg border bg-white p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-semibold text-sm">{selectedDateStr}</h2>
            {isTeacher && (
              <LessonForm students={students} defaultDate={selectedDay} />
            )}
          </div>

          {selectedLessons.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">授業</p>
              {selectedLessons.map((l) => (
                <div key={l.id} className="flex items-start justify-between gap-2 rounded-md bg-blue-50 px-3 py-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{l.student.user.name}</span>
                      <span className={`text-xs rounded-full px-2 py-0.5 ${l.type === "online" ? "bg-green-100 text-green-700" : "bg-purple-100 text-purple-700"}`}>
                        {l.type === "online" ? "オンライン" : "対面"}
                      </span>
                      {l.durationMin && (
                        <span className="text-xs text-muted-foreground">{l.durationMin}分</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {l.date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}〜
                    </p>
                    {l.notes && <p className="text-xs text-gray-600 mt-1">{l.notes}</p>}
                  </div>
                  {isTeacher && (
                    <form
                      action={deleteLesson}
                      onSubmit={(e) => { if (!confirm("この授業を削除しますか？")) e.preventDefault() }}
                    >
                      <input type="hidden" name="lessonId" value={l.id} />
                      <button type="submit" className="text-xs text-red-400 hover:text-red-600">削除</button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          )}

          {selectedDeadlines.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">宿題期限</p>
              {selectedDeadlines.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-md bg-orange-50 px-3 py-2">
                  <div>
                    <Link href={`/homework/${d.id}`} className="text-sm font-medium hover:underline">
                      {d.title}
                    </Link>
                    {isTeacher && (
                      <p className="text-xs text-muted-foreground mt-0.5">{d.studentName}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedLessons.length === 0 && selectedDeadlines.length === 0 && (
            <p className="text-sm text-muted-foreground">この日のイベントはありません</p>
          )}
        </div>
      )}
    </div>
  )
}
