"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronRight, CheckCircle2, Clock3, ExternalLink, FileText, Pencil, Plus, X } from "lucide-react"
import { LessonForm } from "./lesson-form"
import { LessonEditForm } from "./lesson-edit-form"
import { Button, buttonVariants } from "@/components/ui/button"
import { TEST_TYPE_LABELS } from "@/lib/test-types"
import { DeleteLessonButton, DeleteExamEventButton } from "./confirm-buttons"
import { HomeworkForm, ExamEventForm } from "./quick-forms"
import { LessonCompletionControl } from "./lesson-completion-control"
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
  showStudentNames = false,
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
  showStudentNames?: boolean
  editingLessonId: string | null
  setEditingLessonId: (id: string | null) => void
}) {
  const [addType, setAddType] = useState<"lesson" | "homework" | "exam" | "menu" | null>(null)

  return (
    <div className="min-w-0 space-y-3">
      <div className="flex min-w-0 items-center justify-between gap-2 px-1">
        <h2 className="min-w-0 truncate text-sm font-semibold">{dateStr}</h2>
        {isTeacher && addType === null && (
          <Button variant="secondary" size="icon-sm" aria-label="予定を追加" onClick={() => setAddType("menu")}><Plus aria-hidden /></Button>
        )}
      </div>
      {isTeacher && addType !== null && (
        <div className="space-y-2">
          {addType === "menu" && (
            <div className="apple-card-surface w-full overflow-hidden rounded-2xl p-1 sm:max-w-sm">
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-xs font-medium text-muted-foreground">追加する予定</span>
                <Button size="icon-sm" variant="ghost" aria-label="追加メニューを閉じる" onClick={() => setAddType(null)}><X aria-hidden /></Button>
              </div>
              <div className="grid gap-0.5">
                <Button className="w-full justify-start rounded-xl" variant="ghost" onClick={() => setAddType("lesson")}>授業</Button>
                <Button className="w-full justify-start rounded-xl" variant="ghost" onClick={() => setAddType("homework")}>宿題期限</Button>
                <Button className="w-full justify-start rounded-xl" variant="ghost" onClick={() => setAddType("exam")}>テスト</Button>
              </div>
            </div>
          )}
          {addType === "lesson" && <LessonForm students={students} defaultDate={dayKey} subjects={subjects} embedded onClose={() => setAddType(null)} />}
          {addType === "homework" && <HomeworkForm students={students} defaultDate={dayKey} embedded onClose={() => setAddType(null)} />}
          {addType === "exam" && <ExamEventForm students={students} defaultDate={dayKey} embedded onClose={() => setAddType(null)} />}
        </div>
      )}

      {lessons.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">授業</p>
          {lessons.map((l) => {
            const now = new Date()
            const isPast = l.date < now
            return (
              <article key={l.id} className="apple-card-surface min-w-0 overflow-hidden rounded-2xl p-3">
                <div className="min-w-0">
                  <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                    {(isTeacher || showStudentNames) && <h3 className="min-w-0 max-w-full truncate text-sm font-semibold">{l.student.user.name}</h3>}
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                      {l.type === "online" ? "オンライン" : "対面"}
                    </span>
                    {l.completedAt && (
                      <span className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-primary"><CheckCircle2 className="size-3.5" aria-hidden />完了</span>
                    )}
                  </div>
                  <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 whitespace-nowrap">
                      <Clock3 className="size-3.5" aria-hidden />
                      {l.date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}〜
                    </span>
                    {l.durationMin && <span className="whitespace-nowrap">{l.durationMin}分</span>}
                  </div>
                </div>
                {l.subjectIds.length > 0 && (
                  <div className="mt-2 flex min-w-0 flex-wrap gap-1">
                    {l.subjectIds.map((sid) => {
                      const sub = subjects.find((s) => s.id === sid)
                      return sub ? (
                        <span key={sid} className="text-xs bg-muted text-foreground rounded px-1.5 py-0.5">{sub.name}</span>
                      ) : null
                    })}
                  </div>
                )}
                {l.notes && <p className="mt-2 flex min-w-0 items-start gap-1.5 break-words text-xs leading-relaxed text-muted-foreground"><FileText className="mt-0.5 size-3.5 shrink-0" aria-hidden /><span className="min-w-0">{l.notes}</span></p>}
                {l.type === "online" && l.meetLink && (
                  <a
                    href={l.meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonVariants({ variant: "outline", size: "xs", className: "mt-2" })}
                  >
                    <ExternalLink aria-hidden />Meet に参加
                  </a>
                )}
                {(isTeacher ? l.lessonLog : (l.lessonLogPublic ? l.lessonLog : null)) && (
                  <div className="mt-2 min-w-0 rounded-xl border border-border/60 bg-muted/35 p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      授業ログ{isTeacher && l.lessonLogPublic && <span className="ml-1 text-primary">（生徒に公開中）</span>}
                    </p>
                    <p className="break-words whitespace-pre-wrap text-sm leading-relaxed text-foreground">{l.lessonLog}</p>
                  </div>
                )}
                {isTeacher && (l.hourlyRate || l.travelExpense != null) && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {l.hourlyRate && l.durationMin ? `¥${Math.round((l.durationMin / 60) * l.hourlyRate).toLocaleString()}` : l.hourlyRate ? `時給¥${l.hourlyRate.toLocaleString()}` : ""}
                    {l.travelExpense != null && l.travelExpense > 0 ? ` + 交通費¥${l.travelExpense.toLocaleString()}` : ""}
                  </p>
                )}
                {isTeacher && (
                  <div className="mt-3 flex min-w-0 flex-wrap items-center gap-1 border-t border-border/60 pt-2">
                    {(isPast || !!l.completedAt) && (
                      <LessonCompletionControl lessonId={l.id} completed={!!l.completedAt} />
                    )}
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => setEditingLessonId(editingLessonId === l.id ? null : l.id)}
                      aria-label={editingLessonId === l.id ? "授業の編集を閉じる" : "授業を編集"}
                      className="ml-auto"
                    >
                      {editingLessonId === l.id ? <X aria-hidden /> : <Pencil aria-hidden />}
                      {editingLessonId === l.id ? "閉じる" : "編集"}
                    </Button>
                    <DeleteLessonButton lessonId={l.id} />
                  </div>
                )}
                {isTeacher && editingLessonId === l.id && (
                  <LessonEditForm lesson={l} onClose={() => setEditingLessonId(null)} subjects={subjects} />
                )}
              </article>
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
                {(isTeacher || showStudentNames) && (
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
                  {(isTeacher || showStudentNames) && e.studentName && (
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
