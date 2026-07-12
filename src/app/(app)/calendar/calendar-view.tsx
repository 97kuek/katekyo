"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NextLessonBanner } from "./next-lesson-banner"
import { DayDetail } from "./day-detail"
import { pad, toDateKey, DOW_LABELS } from "./calendar-types"
import type { Lesson, HomeworkDeadline, ExamEvent, Student, Subject } from "./calendar-types"

type Props = {
  lessons: Lesson[]
  deadlines: HomeworkDeadline[]
  examEvents: ExamEvent[]
  students: Student[]
  subjects: Subject[]
  isTeacher: boolean
}

export default function CalendarView({ lessons, deadlines, examEvents, students, subjects, isTeacher }: Props) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<string | null>(toDateKey(today))
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"month" | "week">("week")
  const [weekOffset, setWeekOffset] = useState(0)

  // 選択日が変わったら編集中の授業をレンダー中に derived state として閉じる
  // （effect 内の同期 setState を避ける React 推奨パターン）
  const [prevSelectedDay, setPrevSelectedDay] = useState(selectedDay)
  if (selectedDay !== prevSelectedDay) {
    setPrevSelectedDay(selectedDay)
    setEditingLessonId(null)
  }

  const lessonMap = new Map<string, Lesson[]>()
  const hasNoteMap = new Map<string, boolean>()
  for (const l of lessons) {
    const key = toDateKey(l.date)
    if (!lessonMap.has(key)) lessonMap.set(key, [])
    lessonMap.get(key)!.push(l)
    if (l.lessonLog) hasNoteMap.set(key, true)
  }

  const deadlineMap = new Map<string, HomeworkDeadline[]>()
  for (const d of deadlines) {
    const key = toDateKey(d.dueDate)
    if (!deadlineMap.has(key)) deadlineMap.set(key, [])
    deadlineMap.get(key)!.push(d)
  }

  const examEventMap = new Map<string, ExamEvent[]>()
  for (const e of examEvents) {
    const end = e.endDate ?? e.date
    const current = new Date(e.date)
    while (current <= end) {
      const key = toDateKey(current)
      if (!examEventMap.has(key)) examEventMap.set(key, [])
      examEventMap.get(key)!.push(e)
      current.setDate(current.getDate() + 1)
    }
  }

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }
  function goToToday() {
    setYear(today.getFullYear())
    setMonth(today.getMonth())
    setSelectedDay(toDateKey(today))
    setWeekOffset(0)
  }

  // Week view helpers
  const weekSundayBase = new Date(today)
  weekSundayBase.setDate(today.getDate() - today.getDay())
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekSundayBase)
    d.setDate(weekSundayBase.getDate() + i + weekOffset * 7)
    return d
  })

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  while (cells.length % 7 !== 0) cells.push(null)

  const todayKey = toDateKey(today)
  const selectedLessons = selectedDay ? (lessonMap.get(selectedDay) ?? []) : []
  const selectedDeadlines = selectedDay ? (deadlineMap.get(selectedDay) ?? []) : []
  const selectedExamEvents = selectedDay ? (examEventMap.get(selectedDay) ?? []) : []

  const selectedDateStr = selectedDay
    ? new Date(selectedDay + "T00:00:00").toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short" })
    : ""

  return (
    <div className="space-y-4">
      <NextLessonBanner lessons={lessons} isTeacher={isTeacher} />

      {/* ナビゲーションバー: ビュー切替 + 期間移動 */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 rounded-lg border border-input bg-background p-0.5 shrink-0">
          <button
            onClick={() => setViewMode("month")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${viewMode === "month" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            月
          </button>
          <button
            onClick={() => setViewMode("week")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${viewMode === "week" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            週
          </button>
        </div>
        <div className="flex items-center gap-0.5 min-w-0">
          <Button
            onClick={viewMode === "month" ? prevMonth : () => setWeekOffset((w) => w - 1)}
            variant="ghost"
            size="icon-sm"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-semibold text-sm whitespace-nowrap tabular-nums">
            {viewMode === "month"
              ? `${year}年${month + 1}月`
              : `${weekDays[0].getMonth() + 1}/${weekDays[0].getDate()} 〜 ${weekDays[6].getMonth() + 1}/${weekDays[6].getDate()}`}
          </span>
          <Button
            onClick={viewMode === "month" ? nextMonth : () => setWeekOffset((w) => w + 1)}
            variant="ghost"
            size="icon-sm"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button onClick={goToToday} variant="outline" size="xs" className="ml-1 shrink-0">
            {viewMode === "month" ? "今月" : "今週"}
          </Button>
        </div>
      </div>

      {viewMode === "month" ? (
        <>
          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="grid grid-cols-7 text-center">
              {DOW_LABELS.map((d, i) => (
                <div key={d} className={`py-2 text-xs font-medium ${i === 0 ? "text-calendar-sun" : i === 6 ? "text-calendar-sat" : "text-muted-foreground"}`}>
                  {d}
                </div>
              ))}

              {cells.map((day, i) => {
                if (day === null) return <div key={i} className="aspect-square" />
                const key = `${year}-${pad(month + 1)}-${pad(day)}`
                const hasLesson = lessonMap.has(key)
                const hasNote = hasNoteMap.has(key)
                const hasDeadline = deadlineMap.has(key)
                const hasExam = examEventMap.has(key)
                const isToday = key === todayKey
                const isSelected = key === selectedDay
                const dow = (firstDay + day - 1) % 7

                return (
                  <button
                    key={key}
                    onClick={() => setSelectedDay(key)}
                    className={`aspect-square flex flex-col items-center justify-start pt-1.5 gap-0.5 text-xs transition-colors
                      ${isSelected ? "bg-primary/10" : "hover:bg-muted"}
                      ${dow === 0 ? "text-calendar-sun" : dow === 6 ? "text-calendar-sat" : ""}
                    `}
                  >
                    <span className={`h-6 w-6 flex items-center justify-center rounded-full font-medium
                      ${isToday ? "bg-primary text-primary-foreground" : ""}
                    `}>
                      {day}
                    </span>
                    <div className="flex gap-0.5">
                      {hasLesson && <span className="h-1.5 w-1.5 rounded-full bg-calendar-lesson" />}
                      {hasNote && <span className="h-1.5 w-1.5 rounded-full bg-warning" />}
                      {hasDeadline && <span className="h-1.5 w-1.5 rounded-full bg-deadline" />}
                      {hasExam && <span className="h-1.5 w-1.5 rounded-full bg-calendar-exam" />}
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="px-3 pb-3 pt-1 flex items-center gap-4 text-xs text-muted-foreground border-t flex-wrap">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-calendar-lesson inline-block" />授業</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-warning inline-block" />ノートあり</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-deadline inline-block" />宿題期限</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-calendar-exam inline-block" />テスト</span>
            </div>
          </div>

          {selectedDay && (
            <DayDetail
              dayKey={selectedDay}
              dateStr={selectedDateStr}
              lessons={selectedLessons}
              deadlines={selectedDeadlines}
              examEvents={selectedExamEvents}
              isTeacher={isTeacher}
              students={students}
              subjects={subjects}
              editingLessonId={editingLessonId}
              setEditingLessonId={setEditingLessonId}
            />
          )}
        </>
      ) : (
        /* 週表示 */
        <>
          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="grid grid-cols-7 divide-x text-center">
              {weekDays.map((d, i) => {
                const key = toDateKey(d)
                const hasLesson = lessonMap.has(key)
                const hasDeadline = deadlineMap.has(key)
                const hasExam = examEventMap.has(key)
                const isToday = key === todayKey
                const isSelected = key === selectedDay
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedDay(key)}
                    className={`flex flex-col items-center gap-1 py-3 transition-colors ${isSelected ? "bg-primary/10" : "hover:bg-muted"} ${i === 0 ? "text-calendar-sun" : i === 6 ? "text-calendar-sat" : ""}`}
                  >
                    <span className="text-xs text-muted-foreground">{DOW_LABELS[i]}</span>
                    <span className={`h-7 w-7 flex items-center justify-center rounded-full text-sm font-medium ${isToday ? "bg-primary text-primary-foreground" : ""}`}>
                      {d.getDate()}
                    </span>
                    <div className="flex gap-0.5">
                      {hasLesson && <span className="h-1.5 w-1.5 rounded-full bg-calendar-lesson" />}
                      {hasDeadline && <span className="h-1.5 w-1.5 rounded-full bg-deadline" />}
                      {hasExam && <span className="h-1.5 w-1.5 rounded-full bg-calendar-exam" />}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {selectedDay && (
            <DayDetail
              dayKey={selectedDay}
              dateStr={selectedDateStr}
              lessons={selectedLessons}
              deadlines={selectedDeadlines}
              examEvents={selectedExamEvents}
              isTeacher={isTeacher}
              students={students}
              subjects={subjects}
              editingLessonId={editingLessonId}
              setEditingLessonId={setEditingLessonId}
            />
          )}
        </>
      )}
    </div>
  )
}
