import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { StatusBadge } from "@/components/homework/status-badge"
import { CancelSubmissionButton } from "@/app/(app)/homework/cancel-button"
import { relativeDeadline, deadlineColorClass, formatDate } from "@/lib/date-utils"
import { isPendingStatus, HOMEWORK_EVENT_LABELS } from "@/lib/homework-status"
import { AlertCircle, CheckCircle2, Inbox, RotateCcw } from "lucide-react"
import { DifficultyBars } from "@/components/homework/difficulty-bars"
import { MarkFeedbackSeen } from "./mark-feedback-seen"
import { createHomeworkPhotoSignedUrl } from "@/lib/supabase-storage"
import { PageHeader } from "@/components/ui/page-header"
import { Disclosure } from "@/components/ui/disclosure"
import { HomeworkDetailActions } from "./homework-detail-actions"

const DIFFICULTY_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "かんたん",    color: "text-foreground bg-primary/10 border border-primary/20" },
  2: { label: "ふつう",      color: "text-foreground bg-warning/10 border border-warning/25" },
  3: { label: "むずかしい",  color: "text-foreground bg-destructive/10 border border-destructive/20" },
}

export default async function HomeworkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session) redirect("/login")

  const isTeacher = session.user.role === "teacher"
  const isParent = session.user.role === "parent"

  let homework = null

  if (isTeacher) {
    homework = await db.homework.findFirst({
      where: { id, teacherId: session.user.id },
      include: {
        student: { include: { user: { select: { name: true } } } },
        events: { orderBy: { createdAt: "asc" } },
      },
    })
  } else if (isParent) {
    const links = await db.parentStudent.findMany({ where: { parentId: session.user.id }, select: { studentId: true } })
    const studentIds = links.map((l) => l.studentId)
    homework = await db.homework.findFirst({
      where: { id, studentId: { in: studentIds } },
      include: {
        student: { include: { user: { select: { name: true } } } },
        events: { orderBy: { createdAt: "asc" } },
      },
    })
  } else {
    const student = await db.student.findUnique({ where: { userId: session.user.id } })
    if (student) {
      homework = await db.homework.findFirst({
        where: { id, studentId: student.id },
        include: {
          student: { include: { user: { select: { name: true } } } },
          events: { orderBy: { createdAt: "asc" } },
        },
      })
    }
  }

  if (!homework) notFound()

  const photoUrl = homework.photoUrl
    ? await createHomeworkPhotoSignedUrl(homework.photoUrl)
    : null

  const [subjects, material] = await Promise.all([
    db.subject.findMany({
      where: { teacherId: homework.teacherId, id: { in: homework.subjectIds } },
      select: { id: true, name: true },
    }),
    homework.materialId
      ? db.studentMaterial.findFirst({
          where: {
            id: homework.materialId,
            teacherId: homework.teacherId,
            studentId: homework.studentId,
          },
          select: { name: true },
        })
      : null,
  ])

  const isStudent = !isTeacher && !isParent
  const hasUnseenFeedback =
    isStudent && !!homework.teacherFeedback && homework.feedbackSeenAt === null
  const actionLabel = homework.status === "rejected" ? "修正して再提出" : "提出する"

  const primaryAction = isTeacher && homework.status === "submitted"
    ? <Link href={`/homework/${id}/review`} className={buttonVariants({ className: "justify-center" })}>確認・承認する</Link>
    : isStudent && isPendingStatus(homework.status)
      ? <Link href={`/homework/${id}/submit`} className={buttonVariants({ className: "justify-center" })}>{actionLabel}</Link>
      : null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {hasUnseenFeedback && <MarkFeedbackSeen homeworkId={homework.id} />}
      <PageHeader
        backHref="/homework"
        backLabel="宿題一覧"
        title={homework.title}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <StatusBadge status={homework.status} />
            <span className={deadlineColorClass(homework.dueDate)}>
              期限 {formatDate(homework.dueDate)}（{relativeDeadline(homework.dueDate)}）
            </span>
            {(isTeacher || isParent) && <span>・{homework.student.user.name}</span>}
          </span>
        }
        action={primaryAction ? <span className="hidden sm:inline-flex">{primaryAction}</span> : undefined}
      />

      {isTeacher && (
        <HomeworkDetailActions
          homeworkId={id}
          currentDueDate={homework.dueDate.toISOString().slice(0, 10)}
          canEdit={isPendingStatus(homework.status)}
        />
      )}

      {/* 差し戻しフィードバック — 生徒向け目立つバナー */}
      {!isTeacher && !isParent && homework.status === "rejected" && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
            <p className="font-semibold">先生から差し戻しがあります</p>
          </div>
          {homework.teacherFeedback && (
            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{homework.teacherFeedback}</p>
          )}
        </div>
      )}

      <div className="apple-card-surface rounded-2xl p-5 space-y-4">
        <div className="space-y-2 sm:flex sm:items-start sm:justify-between sm:gap-4 sm:space-y-0">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-semibold text-muted-foreground">宿題の内容</h2>
            </div>
            {(isTeacher || isParent) && (
              <p className="text-sm text-muted-foreground mt-1">生徒: {homework.student.user.name}</p>
            )}
          </div>
        </div>

        {(subjects.length > 0 || material) && (
          <div className="flex flex-wrap gap-1">
            {material && (
              <span className="text-xs bg-muted text-foreground rounded-full px-2 py-0.5">
                {material.name}
              </span>
            )}
            {subjects.map((s) => (
              <span key={s.id} className="text-xs bg-muted text-foreground rounded-full px-2 py-0.5">
                {s.name}
              </span>
            ))}
          </div>
        )}

        {homework.description && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">内容</p>
            <p className="text-sm whitespace-pre-wrap">{homework.description}</p>
          </div>
        )}
      </div>

      {(homework.studentNote || homework.submittedAt || homework.photoUrl || homework.difficultyRating) && (
        <Disclosure
          title="提出内容"
          description={homework.submittedAt ? `${homework.submittedAt.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })} に提出` : undefined}
          defaultOpen={isTeacher && homework.status === "submitted"}
        >
          <div className="space-y-3">
          {homework.submittedAt && (
            <p className="text-xs text-muted-foreground">
              提出日時: {homework.submittedAt.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}
            </p>
          )}
          {homework.difficultyRating && (() => {
            const d = DIFFICULTY_LABELS[homework.difficultyRating]
            return d ? (
              <p className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-1 ${d.color}`}>
                <DifficultyBars level={homework.difficultyRating} className="w-4 h-2.5" />
                難易度: {d.label}
              </p>
            ) : null
          })()}
          {photoUrl && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">提出写真</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoUrl}
                alt="提出写真"
                className="w-full max-h-60 sm:max-h-80 object-contain rounded-md border bg-muted"
              />
            </div>
          )}
          {homework.studentNote && (
            <div className="bg-muted rounded-md p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">生徒のコメント</p>
              <p className="text-sm">{homework.studentNote}</p>
            </div>
          )}
          </div>
        </Disclosure>
      )}

      {(homework.teacherFeedback || homework.reviewedAt) && (
        <div className="apple-card-surface rounded-2xl p-5 space-y-2">
          <h2 className="text-sm font-semibold">先生のフィードバック</h2>
          {homework.reviewedAt && (
            <p className="text-xs text-muted-foreground">
              確認日時: {homework.reviewedAt.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}
            </p>
          )}
          {homework.teacherFeedback && (
            <div className={`rounded-md p-3 ${homework.status === "rejected" ? "bg-destructive/10" : "bg-primary/10"}`}>
              <p className="text-sm whitespace-pre-wrap">{homework.teacherFeedback}</p>
            </div>
          )}
        </div>
      )}

      {homework.events.length > 0 && (
        <Disclosure title="これまでのやり取り" description={`${homework.events.length}件の履歴`}>
          <ol className="relative border-l border-border ml-2 space-y-4">
            {homework.events.map((ev) => {
              const config =
                ev.eventType === "approved"
                  ? { Icon: CheckCircle2, color: "text-primary" }
                  : ev.eventType === "rejected"
                  ? { Icon: RotateCcw, color: "text-destructive" }
                  : { Icon: Inbox, color: "text-primary" }
              const label = HOMEWORK_EVENT_LABELS[ev.eventType]
              return (
                <li key={ev.id} className="ml-4">
                  <span className="absolute -left-1.5 flex h-3 w-3 items-center justify-center">
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                  </span>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className={`text-xs font-semibold ${config.color}`}>
                      <config.Icon className="mr-1 inline h-3.5 w-3.5" aria-hidden />
                      {label}
                    </span>
                    <span className="text-xs text-muted-foreground">{ev.actorName}</span>
                    <span className="text-xs text-muted-foreground">
                      {ev.createdAt.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  {ev.note && (
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{ev.note}</p>
                  )}
                </li>
              )
            })}
          </ol>
        </Disclosure>
      )}

      {!isParent && !primaryAction && (
        <div className="flex flex-col gap-3 sm:flex-row">
          {!isTeacher && homework.status === "submitted" && (
            <CancelSubmissionButton homeworkId={id} />
          )}
        </div>
      )}

      {primaryAction && (
        <div className="translucent-chrome sticky bottom-[var(--mobile-nav-clearance)] z-20 -mx-2 rounded-xl border bg-background/95 p-2 shadow-lg backdrop-blur sm:hidden">
          <div className="grid">{primaryAction}</div>
        </div>
      )}
    </div>
  )
}
