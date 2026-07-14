import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { StatusBadge } from "@/components/homework/status-badge"
import { DeleteHomeworkButton } from "./delete-homework-button"
import { CancelSubmissionButton } from "@/app/(app)/homework/cancel-button"
import { relativeDeadline, deadlineColorClass, formatDate } from "@/lib/date-utils"
import { isPendingStatus, HOMEWORK_EVENT_LABELS } from "@/lib/homework-status"
import { ExtendDeadlineButton } from "./extend-deadline"
import { AlertCircle } from "lucide-react"
import { DifficultyBars } from "@/components/homework/difficulty-bars"
import { MarkFeedbackSeen } from "./mark-feedback-seen"

const DIFFICULTY_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "かんたん",    color: "text-primary bg-primary/10" },
  2: { label: "ふつう",      color: "text-warning bg-warning/10" },
  3: { label: "むずかしい",  color: "text-destructive bg-destructive/10" },
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {hasUnseenFeedback && <MarkFeedbackSeen homeworkId={homework.id} />}
      <div className="flex items-center justify-between gap-2">
        <Link href="/homework" className="text-sm text-muted-foreground hover:underline">
          ← 宿題一覧に戻る
        </Link>
        {isTeacher && (
          <div className="flex gap-2 shrink-0">
            {isPendingStatus(homework.status) && (
              <Link
                href={`/homework/${id}/edit`}
                className={buttonVariants({ variant: "ghost", size: "xs" })}
              >
                編集
              </Link>
            )}
            <DeleteHomeworkButton homeworkId={id} />
          </div>
        )}
      </div>

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
          <Link href={`/homework/${homework.id}/submit`} className={buttonVariants({ size: "sm" })}>
            修正して再提出する →
          </Link>
        </div>
      )}

      <div className="rounded-lg border bg-card p-5 space-y-4">
        <div className="space-y-2 sm:flex sm:items-start sm:justify-between sm:gap-4 sm:space-y-0">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold">{homework.title}</h1>
              <StatusBadge status={homework.status} />
            </div>
            {(isTeacher || isParent) && (
              <p className="text-sm text-muted-foreground mt-1">生徒: {homework.student.user.name}</p>
            )}
          </div>
          <div className="text-sm sm:text-right sm:shrink-0">
            <p className="text-muted-foreground">作成: {formatDate(homework.createdAt)}</p>
            <p className={`mt-0.5 ${deadlineColorClass(homework.dueDate)}`}>
              期限: {formatDate(homework.dueDate)}
              <span className="ml-1 text-xs">（{relativeDeadline(homework.dueDate)}）</span>
            </p>
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
        <div className="rounded-lg border bg-card p-5 space-y-2">
          <h2 className="text-sm font-semibold">提出情報</h2>
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
          {homework.photoUrl && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">提出写真</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={homework.photoUrl}
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
      )}

      {(homework.teacherFeedback || homework.reviewedAt) && (
        <div className="rounded-lg border bg-card p-5 space-y-2">
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
        <div className="rounded-lg border bg-card p-5 space-y-3">
          <h2 className="text-sm font-semibold">やり取り履歴</h2>
          <ol className="relative border-l border-border ml-2 space-y-4">
            {homework.events.map((ev) => {
              const config =
                ev.eventType === "approved"
                  ? { icon: "✅", color: "text-primary" }
                  : ev.eventType === "rejected"
                  ? { icon: "🔁", color: "text-destructive" }
                  : { icon: "📬", color: "text-primary" }
              const label = HOMEWORK_EVENT_LABELS[ev.eventType]
              return (
                <li key={ev.id} className="ml-4">
                  <span className="absolute -left-1.5 flex h-3 w-3 items-center justify-center">
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                  </span>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className={`text-xs font-semibold ${config.color}`}>
                      {config.icon} {label}
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
        </div>
      )}

      {!isParent && (
        <div className="flex flex-col sm:flex-row gap-3">
          {!isTeacher && isPendingStatus(homework.status) && (
            <Link href={`/homework/${id}/submit`} className={buttonVariants({ className: "justify-center" })}>
              提出する
            </Link>
          )}
          {!isTeacher && homework.status === "submitted" && (
            <CancelSubmissionButton homeworkId={id} />
          )}
          {isTeacher && homework.status === "submitted" && (
            <Link href={`/homework/${id}/review`} className={buttonVariants({ className: "justify-center" })}>
              確認・承認する
            </Link>
          )}
          {isTeacher && (
            <ExtendDeadlineButton
              homeworkId={id}
              currentDueDate={homework.dueDate.toISOString().slice(0, 10)}
            />
          )}
        </div>
      )}
    </div>
  )
}
