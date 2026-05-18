import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { StatusBadge } from "@/components/homework/status-badge"
import { DeleteHomeworkButton } from "./delete-homework-button"
import { CancelSubmissionButton } from "@/app/(app)/homework/cancel-button"
import { relativeDeadline, deadlineColorClass } from "@/lib/date-utils"
import { ExtendDeadlineButton } from "./extend-deadline"
import { AlertCircle } from "lucide-react"

const DIFFICULTY_LABELS: Record<number, { label: string; emoji: string; color: string }> = {
  1: { label: "かんたん",    emoji: "😊", color: "text-green-700 bg-green-50" },
  2: { label: "ふつう",      emoji: "😐", color: "text-yellow-700 bg-yellow-50" },
  3: { label: "むずかしい",  emoji: "😰", color: "text-red-700 bg-red-50" },
}

export default async function HomeworkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session) redirect("/login")

  const isTeacher = session.user.role === "teacher"

  const homework = isTeacher
    ? await db.homework.findFirst({
        where: { id, teacherId: session.user.id },
        include: {
          student: { include: { user: { select: { name: true } } } },
        },
      })
    : await (async () => {
        const student = await db.student.findUnique({ where: { userId: session.user.id } })
        if (!student) return null
        return db.homework.findFirst({
          where: { id, studentId: student.id },
          include: { student: { include: { user: { select: { name: true } } } } },
        })
      })()

  if (!homework) notFound()

  const [subjects, material] = await Promise.all([
    db.subject.findMany({
      where: { teacherId: homework.teacherId, id: { in: homework.subjectIds } },
      select: { id: true, name: true },
    }),
    homework.materialId
      ? db.studentMaterial.findUnique({ where: { id: homework.materialId }, select: { name: true } })
      : null,
  ])

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/homework" className="text-sm text-muted-foreground hover:underline">
          ← 宿題一覧に戻る
        </Link>
        {isTeacher && (
          <div className="flex gap-2">
            {["assigned", "rejected"].includes(homework.status) && (
              <Link
                href={`/homework/${id}/edit`}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                編集
              </Link>
            )}
            <DeleteHomeworkButton homeworkId={id} />
          </div>
        )}
      </div>

      {/* 差し戻しフィードバック — 生徒向け目立つバナー */}
      {!isTeacher && homework.status === "rejected" && (
        <div className="rounded-xl border-2 border-red-300 bg-red-50 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
            <p className="font-semibold text-red-800">先生から差し戻しがあります</p>
          </div>
          {homework.teacherFeedback && (
            <p className="text-sm text-red-700 leading-relaxed">{homework.teacherFeedback}</p>
          )}
          <Link href={`/homework/${homework.id}/submit`} className={buttonVariants({ size: "sm", className: "bg-red-600 hover:bg-red-700 text-white" })}>
            修正して再提出する →
          </Link>
        </div>
      )}

      <div className="rounded-lg border bg-white p-5 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold">{homework.title}</h1>
              <StatusBadge status={homework.status} />
            </div>
            {isTeacher && (
              <p className="text-sm text-muted-foreground mt-1">生徒: {homework.student.user.name}</p>
            )}
          </div>
          <div className="text-right text-sm shrink-0">
            <p className="text-muted-foreground">作成: {homework.createdAt.toLocaleDateString("ja-JP")}</p>
            <p className={`mt-0.5 ${deadlineColorClass(homework.dueDate)}`}>
              期限: {homework.dueDate.toLocaleDateString("ja-JP")}
              <span className="ml-1 text-xs">（{relativeDeadline(homework.dueDate)}）</span>
            </p>
          </div>
        </div>

        {(subjects.length > 0 || material) && (
          <div className="flex flex-wrap gap-1">
            {material && (
              <span className="text-xs bg-amber-50 text-amber-700 rounded-full px-2 py-0.5">
                📖 {material.name}
              </span>
            )}
            {subjects.map((s) => (
              <span key={s.id} className="text-xs bg-blue-50 text-blue-700 rounded-full px-2 py-0.5">
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
        <div className="rounded-lg border bg-white p-5 space-y-2">
          <h2 className="text-sm font-semibold">提出情報</h2>
          {homework.submittedAt && (
            <p className="text-xs text-muted-foreground">
              提出日時: {homework.submittedAt.toLocaleString("ja-JP")}
            </p>
          )}
          {homework.difficultyRating && (() => {
            const d = DIFFICULTY_LABELS[homework.difficultyRating]
            return d ? (
              <p className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-1 ${d.color}`}>
                {d.emoji} 難易度: {d.label}
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
                className="w-full max-h-80 object-contain rounded-md border bg-gray-50"
              />
            </div>
          )}
          {homework.studentNote && (
            <div className="bg-gray-50 rounded-md p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">生徒のコメント</p>
              <p className="text-sm">{homework.studentNote}</p>
            </div>
          )}
        </div>
      )}

      {(homework.teacherFeedback || homework.reviewedAt) && (
        <div className="rounded-lg border bg-white p-5 space-y-2">
          <h2 className="text-sm font-semibold">先生のフィードバック</h2>
          {homework.reviewedAt && (
            <p className="text-xs text-muted-foreground">
              確認日時: {homework.reviewedAt.toLocaleString("ja-JP")}
            </p>
          )}
          {homework.teacherFeedback && (
            <div className={`rounded-md p-3 ${homework.status === "rejected" ? "bg-red-50" : "bg-green-50"}`}>
              <p className="text-sm">{homework.teacherFeedback}</p>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 flex-wrap items-center">
        {!isTeacher && ["assigned", "rejected"].includes(homework.status) && (
          <Link href={`/homework/${id}/submit`} className={buttonVariants()}>
            提出する
          </Link>
        )}
        {!isTeacher && homework.status === "submitted" && (
          <CancelSubmissionButton homeworkId={id} />
        )}
        {isTeacher && homework.status === "submitted" && (
          <Link href={`/homework/${id}/review`} className={buttonVariants()}>
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
    </div>
  )
}
