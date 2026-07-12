import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import SubmitForm from "./submit-form"
import { StatusBadge } from "@/components/homework/status-badge"
import { formatDate } from "@/lib/date-utils"
import { isPendingStatus } from "@/lib/homework-status"

export default async function SubmitHomeworkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session || session.user.role !== "student") redirect("/dashboard")

  const student = await db.student.findUnique({ where: { userId: session.user.id } })
  if (!student) redirect("/dashboard")

  const homework = await db.homework.findFirst({
    where: { id, studentId: student.id },
  })

  if (!homework) notFound()
  if (!isPendingStatus(homework.status)) redirect("/homework")

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/homework" className="text-sm text-muted-foreground hover:underline">
        ← 宿題一覧に戻る
      </Link>

      <div className="rounded-lg border bg-card p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-semibold text-lg">{homework.title}</h2>
          <StatusBadge status={homework.status} />
        </div>
        <p className="text-sm text-muted-foreground">
          期限: {formatDate(homework.dueDate)}
        </p>
        {homework.description && (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{homework.description}</p>
        )}
        {homework.status === "rejected" && homework.teacherFeedback && (
          <div className="bg-destructive/10 rounded-md p-3">
            <p className="text-xs font-medium text-destructive mb-1">先生のコメント</p>
            <p className="text-sm text-destructive whitespace-pre-wrap">{homework.teacherFeedback}</p>
          </div>
        )}
      </div>

      <SubmitForm
        id={id}
        rejectedFeedback={homework.status === "rejected" ? homework.teacherFeedback : null}
        requiresPhoto={homework.requiresPhoto}
      />
    </div>
  )
}
