import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { StatusBadge } from "@/components/homework/status-badge"
import { DeleteHomeworkButton } from "./delete-homework-button"

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

  const subjects = await db.subject.findMany({
    where: { teacherId: homework.teacherId, id: { in: homework.subjectIds } },
    select: { id: true, name: true },
  })
  const subjectMap = new Map(subjects.map((s) => [s.id, s.name]))

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
          <div className="text-right text-sm text-muted-foreground shrink-0">
            <p>期限: {homework.dueDate.toLocaleDateString("ja-JP")}</p>
            <p className="mt-0.5">作成: {homework.createdAt.toLocaleDateString("ja-JP")}</p>
          </div>
        </div>

        {subjects.length > 0 && (
          <div className="flex flex-wrap gap-1">
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

      {(homework.studentNote || homework.submittedAt) && (
        <div className="rounded-lg border bg-white p-5 space-y-2">
          <h2 className="text-sm font-semibold">提出情報</h2>
          {homework.submittedAt && (
            <p className="text-xs text-muted-foreground">
              提出日時: {homework.submittedAt.toLocaleString("ja-JP")}
            </p>
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

      <div className="flex gap-3 flex-wrap">
        {!isTeacher && ["assigned", "rejected"].includes(homework.status) && (
          <Link href={`/homework/${id}/submit`} className={buttonVariants()}>
            提出する
          </Link>
        )}
        {isTeacher && homework.status === "submitted" && (
          <Link href={`/homework/${id}/review`} className={buttonVariants()}>
            確認・承認する
          </Link>
        )}
      </div>
    </div>
  )
}
