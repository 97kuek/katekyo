import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import SubmitForm from "./submit-form"
import { StatusBadge } from "@/components/homework/status-badge"
import { formatDate } from "@/lib/date-utils"
import { isPendingStatus } from "@/lib/homework-status"
import { PageHeader } from "@/components/ui/page-header"

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
      <PageHeader backHref={`/homework/${id}`} backLabel="宿題詳細" title="宿題を提出" description="必要な内容を確認して先生へ提出します。" />

      <div className="apple-card-surface rounded-2xl p-5 space-y-3">
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
      </div>

      <SubmitForm
        id={id}
        rejectedFeedback={homework.status === "rejected" ? homework.teacherFeedback : null}
        requiresPhoto={homework.requiresPhoto}
      />
    </div>
  )
}
