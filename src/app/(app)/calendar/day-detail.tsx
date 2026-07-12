"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronRight, CheckCheck, Pencil } from "lucide-react"
import { LessonForm } from "./lesson-form"
import { LessonEditForm } from "./lesson-edit-form"
import { Button, buttonVariants } from "@/components/ui/button"
import { TEST_TYPE_LABELS } from "@/lib/test-types"
import { DeleteLessonButton, UncompleteLessonButton, DeleteExamEventButton } from "./confirm-buttons"
import { CompleteLessonLogForm, HomeworkForm, ExamEventForm } from "./quick-forms"
import type { Lesson, HomeworkDeadline, ExamEvent, Student, Subject } from "./calendar-types"

export function DayDetail({
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
    <div className="rounded-lg border bg-card p-4 space-y-3">
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
              <div key={l.id} className="rounded-md px-3 py-2 bg-muted">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex items-center gap-x-2 gap-y-0.5 flex-wrap">
                    <span className="text-sm font-medium">{l.student.user.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {l.type === "online" ? "オンライン" : "対面"}
                    </span>
                    {l.durationMin && (
                      <span className="text-xs text-muted-foreground">{l.durationMin}分</span>
                    )}
                    {l.completedAt && (
                      <span className="text-xs text-primary font-medium">✓ 完了</span>
                    )}
                  </div>
                  {isTeacher && (
                    <div className="flex items-center gap-1 shrink-0">
                      {isPast && !l.completedAt && (
                        completingLessonId === l.id ? (
                          <button onClick={() => setCompletingLessonId(null)} className="text-xs text-muted-foreground hover:text-foreground px-1">✕</button>
                        ) : (
                          <Button
                            onClick={() => { setCompletingLessonId(l.id); setEditingLessonId(null) }}
                            variant="outline"
                            size="xs"
                            title="完了にする"
                          >
                            <CheckCheck className="h-3.5 w-3.5 mr-1" />
                            完了
                          </Button>
                        )
                      )}
                      {l.completedAt && <UncompleteLessonButton lessonId={l.id} />}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => { setEditingLessonId(editingLessonId === l.id ? null : l.id); setCompletingLessonId(null) }}
                        title={editingLessonId === l.id ? "閉じる" : "編集"}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <DeleteLessonButton lessonId={l.id} />
                    </div>
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
                        <span key={sid} className="text-xs bg-muted text-foreground rounded px-1.5 py-0.5">{sub.name}</span>
                      ) : null
                    })}
                  </div>
                )}
                {l.notes && <p className="text-xs text-muted-foreground mt-1">📝 {l.notes}</p>}
                {l.type === "online" && l.meetLink && (
                  <a
                    href={l.meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonVariants({ size: "xs" }) + " mt-1.5"}
                  >
                    Meet に参加する →
                  </a>
                )}
                {(isTeacher ? l.lessonLog : (l.lessonLogPublic ? l.lessonLog : null)) && (
                  <div className="mt-2 bg-card border border-border rounded-md p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      授業ログ{isTeacher && l.lessonLogPublic && <span className="ml-1 text-primary">（生徒に公開中）</span>}
                    </p>
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{l.lessonLog}</p>
                  </div>
                )}
                {isTeacher && (l.hourlyRate || l.travelExpense != null) && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {l.hourlyRate && l.durationMin ? `¥${Math.round((l.durationMin / 60) * l.hourlyRate).toLocaleString()}` : l.hourlyRate ? `時給¥${l.hourlyRate.toLocaleString()}` : ""}
                    {l.travelExpense != null && l.travelExpense > 0 ? ` + 交通費¥${l.travelExpense.toLocaleString()}` : ""}
                  </p>
                )}
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
              className="flex items-center justify-between rounded-md bg-warning/10 px-3 py-2 hover:bg-warning/15 transition-colors"
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
            <div key={e.id} className="rounded-md bg-muted px-3 py-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{e.name}</span>
                    <span className="text-xs rounded-full px-2 py-0.5 bg-border text-foreground">
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
