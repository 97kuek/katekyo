"use client"

import { useState, useTransition, useActionState, useEffect } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { LessonForm } from "./lesson-form"
import { LessonEditForm } from "./lesson-edit-form"
import { deleteLesson, createExamEvent, deleteExamEvent, completeLesson, uncompleteLesson, createHomeworkFromCalendar } from "./actions"
import { MaterialSendButton } from "@/components/material-send-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TEST_TYPE_LABELS, TEST_TYPE_OPTIONS } from "@/lib/test-types"
import { toast } from "sonner"

function DeleteLessonButton({ lessonId }: { lessonId: string }) {
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-xs text-gray-600">削除?</span>
        <button
          onClick={() => startTransition(async () => {
            const fd = new FormData()
            fd.append("lessonId", lessonId)
            await deleteLesson(fd)
          })}
          disabled={isPending}
          className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
        >
          {isPending ? "..." : "削除"}
        </button>
        <button onClick={() => setConfirming(false)} className="text-xs text-gray-400 hover:text-gray-600">
          ✕
        </button>
      </div>
    )
  }

  return (
    <button onClick={() => setConfirming(true)} className="text-xs text-red-400 hover:text-red-600 shrink-0">
      削除
    </button>
  )
}

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
  completedAt: Date | null
  meetLink: string | null
  student: { user: { name: string } }
}

function CompleteLessonLogForm({ lessonId, onClose }: { lessonId: string; onClose: () => void }) {
  const [log, setLog] = useState("")
  const [isPending, startTransition] = useTransition()

  function submit(withLog: boolean) {
    startTransition(async () => {
      const fd = new FormData()
      fd.append("lessonId", lessonId)
      if (withLog && log.trim()) fd.append("lessonLog", log.trim())
      await completeLesson(fd)
      onClose()
    })
  }

  return (
    <div className="mt-2 pt-2 border-t border-green-100 space-y-2">
      <p className="text-xs font-medium text-green-700">授業ログを残す（任意）</p>
      <textarea
        value={log}
        onChange={(e) => setLog(e.target.value)}
        placeholder="今日の授業メモ..."
        rows={2}
        autoFocus
        className="w-full text-xs rounded border border-input bg-background px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <div className="flex gap-2">
        <button
          onClick={() => submit(true)}
          disabled={isPending}
          className="text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded px-2.5 py-1 disabled:opacity-50"
        >
          {isPending ? "..." : "完了にする"}
        </button>
        <button onClick={() => submit(false)} disabled={isPending} className="text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50">
          スキップ
        </button>
        <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600 ml-auto">
          キャンセル
        </button>
      </div>
    </div>
  )
}

function UncompleteLessonButton({ lessonId }: { lessonId: string }) {
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-xs text-gray-600">取り消し?</span>
        <button
          onClick={() => startTransition(async () => {
            const fd = new FormData()
            fd.append("lessonId", lessonId)
            await uncompleteLesson(fd)
          })}
          disabled={isPending}
          className="text-xs font-medium text-orange-600 hover:text-orange-800 disabled:opacity-50"
        >
          {isPending ? "..." : "はい"}
        </button>
        <button onClick={() => setConfirming(false)} className="text-xs text-gray-400 hover:text-gray-600">
          ✕
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs text-orange-400 hover:text-orange-600"
    >
      取り消し
    </button>
  )
}

type HomeworkDeadline = {
  id: string
  title: string
  dueDate: Date
  studentName: string
}

type ExamEvent = {
  id: string
  date: Date
  endDate?: Date | null
  name: string
  testType: string
  studentName?: string
}

type Student = { id: string; grade: string; user: { name: string }; defaultHourlyRate?: number | null; defaultTravelExpense?: number | null; defaultSubjectIds?: string[] | null }

type Props = {
  lessons: Lesson[]
  deadlines: HomeworkDeadline[]
  examEvents: ExamEvent[]
  students: Student[]
  subjects: Subject[]
  isTeacher: boolean
}

function pad(n: number) { return String(n).padStart(2, "0") }

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

const DOW_LABELS = ["日", "月", "火", "水", "木", "金", "土"]

function DeleteExamEventButton({ examEventId }: { examEventId: string }) {
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-xs text-gray-600">削除?</span>
        <button
          onClick={() => startTransition(async () => {
            const fd = new FormData()
            fd.append("examEventId", examEventId)
            await deleteExamEvent(fd)
          })}
          disabled={isPending}
          className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
        >
          {isPending ? "..." : "削除"}
        </button>
        <button onClick={() => setConfirming(false)} className="text-xs text-gray-400 hover:text-gray-600">
          ✕
        </button>
      </div>
    )
  }
  return (
    <button onClick={() => setConfirming(true)} className="text-xs text-red-400 hover:text-red-600 shrink-0">
      削除
    </button>
  )
}

function HomeworkForm({ students, defaultDate }: { students: Student[]; defaultDate: string }) {
  const [state, action, isPending] = useActionState(createHomeworkFromCalendar, { error: "" })
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!state.timestamp) return
    setOpen(false)
    toast.success("宿題を追加しました")
  }, [state.timestamp])

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size="sm" variant="outline" className="text-orange-600 border-orange-200 hover:bg-orange-50">
        宿題を追加
      </Button>
    )
  }

  return (
    <div className="rounded-lg border border-orange-200 bg-orange-50/30 p-3 space-y-3 w-full">
      <h3 className="font-medium text-sm">宿題を追加</h3>
      <form action={action} className="space-y-3">
        {state.error && <p className="text-xs text-red-600 bg-red-50 p-2 rounded">{state.error}</p>}
        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-xs">生徒</Label>
            {students.length === 1 ? (
              <>
                <input type="hidden" name="studentId" value={students[0].id} />
                <p className="text-sm py-1.5 px-3 rounded-md border bg-gray-50">{students[0].user.name}（{students[0].grade}）</p>
              </>
            ) : (
              <select
                name="studentId"
                required
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">選択してください</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.user.name}（{s.grade}）</option>
                ))}
              </select>
            )}
          </div>
          <div className="space-y-1">
            <Label className="text-xs">タイトル</Label>
            <Input name="title" placeholder="例: 数学 p.30-35" required className="h-9 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">期限</Label>
            <Input name="dueDate" type="date" required defaultValue={defaultDate} className="h-9 text-sm" />
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={isPending} className="bg-orange-500 hover:bg-orange-600">
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

function ExamEventForm({ students, defaultDate }: { students: Student[]; defaultDate: string }) {
  const [state, action, isPending] = useActionState(createExamEvent, { error: "" })
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!state.timestamp) return
    setOpen(false)
    toast.success("テストを追加しました")
  }, [state.timestamp])

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
        テストを追加
      </Button>
    )
  }

  return (
    <div className="rounded-lg border border-red-200 bg-red-50/30 p-3 space-y-3 w-full">
      <h3 className="font-medium text-sm">テストを追加</h3>
      <form action={action} className="space-y-3">
        {state.error && (
          <p className="text-xs text-red-600 bg-red-50 p-2 rounded">{state.error}</p>
        )}
        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-xs">生徒</Label>
            {students.length === 1 ? (
              <>
                <input type="hidden" name="studentId" value={students[0].id} />
                <p className="text-sm py-1.5 px-3 rounded-md border bg-gray-50">{students[0].user.name}（{students[0].grade}）</p>
              </>
            ) : (
              <select
                name="studentId"
                required
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">選択してください</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.user.name}（{s.grade}）</option>
                ))}
              </select>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">開始日</Label>
              <Input name="date" type="date" required defaultValue={defaultDate} className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">終了日（任意）</Label>
              <Input name="endDate" type="date" className="h-9 text-sm" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">テスト名</Label>
            <Input name="name" placeholder="例: 英語期末テスト" required className="h-9 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">種別</Label>
            <select
              name="testType"
              defaultValue="exam"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {TEST_TYPE_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={isPending} className="bg-red-600 hover:bg-red-700">
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

function DayDetail({
  dayKey,
  dateStr,
  lessons,
  deadlines,
  examEvents,
  isTeacher,
  students,
  subjects,
  editingLessonId,
  setEditingLessonId,
}: {
  dayKey: string
  dateStr: string
  lessons: Lesson[]
  deadlines: HomeworkDeadline[]
  examEvents: ExamEvent[]
  isTeacher: boolean
  students: Student[]
  subjects: Subject[]
  editingLessonId: string | null
  setEditingLessonId: (id: string | null) => void
}) {
  const [completingLessonId, setCompletingLessonId] = useState<string | null>(null)

  return (
    <div className="rounded-lg border bg-white p-4 space-y-3">
      <h2 className="font-semibold text-sm">{dateStr}</h2>
      {isTeacher && (
        <div className="flex gap-2 flex-wrap">
          <LessonForm students={students} defaultDate={dayKey} subjects={subjects} />
          <HomeworkForm students={students} defaultDate={dayKey} />
          <ExamEventForm students={students} defaultDate={dayKey} />
        </div>
      )}

      {lessons.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">授業</p>
          {lessons.map((l) => {
            const now = new Date()
            const isPast = l.date < now
            return (
              <div key={l.id} className={`rounded-md px-3 py-2 ${l.completedAt ? "bg-green-50" : "bg-blue-50"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{l.student.user.name}</span>
                      <span className={`text-xs rounded-full px-2 py-0.5 ${l.type === "online" ? "bg-green-100 text-green-700" : "bg-purple-100 text-purple-700"}`}>
                        {l.type === "online" ? "オンライン" : "対面"}
                      </span>
                      {l.durationMin && (
                        <span className="text-xs text-muted-foreground">{l.durationMin}分</span>
                      )}
                      {l.completedAt && (
                        <span className="text-xs text-green-700 font-medium">✓ 完了</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {l.date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}〜
                    </p>
                    {l.subjectIds.length > 0 && (
                      <div className="flex gap-1 flex-wrap mt-1">
                        {l.subjectIds.map((sid) => {
                          const sub = subjects.find((s) => s.id === sid)
                          return sub ? (
                            <span key={sid} className="text-xs bg-indigo-50 text-indigo-600 rounded px-1.5 py-0.5">{sub.name}</span>
                          ) : null
                        })}
                      </div>
                    )}
                    {l.notes && <p className="text-xs text-gray-500 mt-1">📝 {l.notes}</p>}
                    {l.type === "online" && l.meetLink && (
                      <a
                        href={l.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded px-2.5 py-1"
                      >
                        Meet に参加する →
                      </a>
                    )}
                    {!isTeacher && <MaterialSendButton lessonId={l.id} />}
                    {(isTeacher ? l.lessonLog : (l.lessonLogPublic ? l.lessonLog : null)) && (
                      <div className="mt-1.5 bg-amber-50 rounded p-2">
                        <p className="text-xs font-medium text-amber-700 mb-0.5">
                          授業ログ{isTeacher && l.lessonLogPublic && <span className="ml-1 text-green-600">（生徒に公開中）</span>}
                        </p>
                        <p className="text-xs text-amber-900 whitespace-pre-wrap">{l.lessonLog}</p>
                      </div>
                    )}
                    {isTeacher && (l.hourlyRate || l.travelExpense != null) && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {l.hourlyRate && l.durationMin ? `¥${Math.round((l.durationMin / 60) * l.hourlyRate).toLocaleString()}` : l.hourlyRate ? `時給¥${l.hourlyRate.toLocaleString()}` : ""}
                        {l.travelExpense != null && l.travelExpense > 0 ? ` + 交通費¥${l.travelExpense.toLocaleString()}` : ""}
                      </p>
                    )}
                  </div>
                  {isTeacher && (
                    <div className="flex items-center gap-2 shrink-0">
                      {isPast && !l.completedAt && (
                        completingLessonId === l.id ? (
                          <button onClick={() => setCompletingLessonId(null)} className="text-xs text-gray-400 hover:text-gray-600">キャンセル</button>
                        ) : (
                          <button
                            onClick={() => { setCompletingLessonId(l.id); setEditingLessonId(null) }}
                            className="text-xs font-medium text-green-600 hover:text-green-800 border border-green-200 rounded px-1.5 py-0.5"
                          >
                            完了
                          </button>
                        )
                      )}
                      {l.completedAt && <UncompleteLessonButton lessonId={l.id} />}
                      <button
                        onClick={() => { setEditingLessonId(editingLessonId === l.id ? null : l.id); setCompletingLessonId(null) }}
                        className="text-xs text-blue-500 hover:text-blue-700"
                      >
                        {editingLessonId === l.id ? "閉じる" : "編集"}
                      </button>
                      <DeleteLessonButton lessonId={l.id} />
                    </div>
                  )}
                </div>
                {isTeacher && completingLessonId === l.id && (
                  <CompleteLessonLogForm lessonId={l.id} onClose={() => setCompletingLessonId(null)} />
                )}
                {isTeacher && editingLessonId === l.id && (
                  <LessonEditForm lesson={l} onClose={() => setEditingLessonId(null)} subjects={subjects} />
                )}
              </div>
            )
          })}
        </div>
      )}

      {deadlines.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">宿題期限</p>
          {deadlines.map((d) => (
            <Link
              key={d.id}
              href={`/homework/${d.id}`}
              className="flex items-center justify-between rounded-md bg-orange-50 px-3 py-2 hover:bg-orange-100 transition-colors"
            >
              <div>
                <p className="text-sm font-medium">{d.title}</p>
                {isTeacher && (
                  <p className="text-xs text-muted-foreground mt-0.5">{d.studentName}</p>
                )}
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-2" />
            </Link>
          ))}
        </div>
      )}

      {examEvents.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">テスト</p>
          {examEvents.map((e) => (
            <div key={e.id} className="rounded-md bg-red-50 px-3 py-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{e.name}</span>
                    <span className="text-xs rounded-full px-2 py-0.5 bg-red-100 text-red-700">
                      {TEST_TYPE_LABELS[e.testType as keyof typeof TEST_TYPE_LABELS] ?? e.testType}
                    </span>
                  </div>
                  {isTeacher && e.studentName && (
                    <p className="text-xs text-muted-foreground mt-0.5">{e.studentName}</p>
                  )}
                  {e.endDate && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {e.date.toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo", month: "numeric", day: "numeric" })}〜
                      {e.endDate.toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo", month: "numeric", day: "numeric" })}
                    </p>
                  )}
                </div>
                {isTeacher && <DeleteExamEventButton examEventId={e.id} />}
              </div>
            </div>
          ))}
        </div>
      )}

      {lessons.length === 0 && deadlines.length === 0 && examEvents.length === 0 && (
        <p className="text-sm text-muted-foreground">この日のイベントはありません</p>
      )}
    </div>
  )
}

function NextLessonBanner({ lessons, isTeacher }: { lessons: Lesson[]; isTeacher: boolean }) {
  const now = new Date()
  const next = lessons.find((l) => l.date > now)
  if (!next) return null

  // カレンダー日付の差（時刻を除く）で計算することで正確な「明日/明後日」を表示
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const lessonMidnight = new Date(next.date.getFullYear(), next.date.getMonth(), next.date.getDate())
  const diffDays = Math.round((lessonMidnight.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24))
  const when = diffDays === 0 ? "今日" : diffDays === 1 ? "明日" : diffDays === 2 ? "明後日" : `${diffDays}日後`

  return (
    <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 flex items-center gap-3">
      <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-lg">📅</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-blue-900">
          次の授業: <span className="text-blue-600">{when}</span>
          {" — "}
          {next.date.toLocaleDateString("ja-JP", { month: "short", day: "numeric", weekday: "short" })}{" "}
          {next.date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
        </p>
        <p className="text-xs text-blue-700 mt-0.5 truncate">
          {isTeacher ? `${next.student.user.name} · ` : ""}
          {next.type === "online" ? "オンライン" : "対面"}
          {next.durationMin ? ` · ${next.durationMin}分` : ""}
        </p>
      </div>
      {next.type === "online" && next.meetLink && (
        <a
          href={next.meetLink}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded px-3 py-1.5"
        >
          参加する
        </a>
      )}
    </div>
  )
}

export default function CalendarView({ lessons, deadlines, examEvents, students, subjects, isTeacher }: Props) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<string | null>(toDateKey(today))
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"month" | "week">("week")
  const [weekOffset, setWeekOffset] = useState(0)

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

      {/* View mode toggle */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 rounded-md border border-input bg-background p-0.5">
          <button
            onClick={() => setViewMode("month")}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${viewMode === "month" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            月
          </button>
          <button
            onClick={() => setViewMode("week")}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${viewMode === "week" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            週
          </button>
        </div>
      </div>

      {viewMode === "month" ? (
        <>
          <div className="rounded-lg border bg-white overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">
                  {year}年 {month + 1}月
                </span>
                <button
                  onClick={goToToday}
                  className="text-xs text-muted-foreground hover:text-foreground border border-input rounded px-2 py-0.5 hover:bg-gray-50"
                >
                  今月
                </button>
              </div>
              <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 text-center">
              {DOW_LABELS.map((d, i) => (
                <div key={d} className={`py-2 text-xs font-medium ${i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-muted-foreground"}`}>
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
                      {hasNote && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />}
                      {hasDeadline && <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />}
                      {hasExam && <span className="h-1.5 w-1.5 rounded-full bg-red-500" />}
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="px-3 pb-3 pt-1 flex items-center gap-4 text-xs text-muted-foreground border-t flex-wrap">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-400 inline-block" />授業</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400 inline-block" />ノートあり</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-orange-400 inline-block" />宿題期限</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500 inline-block" />テスト</span>
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
          <div className="rounded-lg border bg-white overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <button onClick={() => setWeekOffset(w => w - 1)} className="p-1 hover:bg-gray-100 rounded">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">
                  {weekDays[0].toLocaleDateString("ja-JP", { month: "long", day: "numeric" })} 〜 {weekDays[6].toLocaleDateString("ja-JP", { month: "long", day: "numeric" })}
                </span>
                <button
                  onClick={goToToday}
                  className="text-xs text-muted-foreground hover:text-foreground border border-input rounded px-2 py-0.5 hover:bg-gray-50"
                >
                  今週
                </button>
              </div>
              <button onClick={() => setWeekOffset(w => w + 1)} className="p-1 hover:bg-gray-100 rounded">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

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
                    className={`flex flex-col items-center gap-1 py-3 transition-colors ${isSelected ? "bg-primary/10" : "hover:bg-gray-50"} ${i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : ""}`}
                  >
                    <span className="text-xs text-muted-foreground">{DOW_LABELS[i]}</span>
                    <span className={`h-7 w-7 flex items-center justify-center rounded-full text-sm font-medium ${isToday ? "bg-primary text-primary-foreground" : ""}`}>
                      {d.getDate()}
                    </span>
                    <div className="flex gap-0.5">
                      {hasLesson && <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />}
                      {hasDeadline && <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />}
                      {hasExam && <span className="h-1.5 w-1.5 rounded-full bg-red-500" />}
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
