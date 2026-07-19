import Link from "next/link"
import { StatusBadge } from "@/components/homework/status-badge"
import { HomeworkActions } from "./homework-actions"
import { deadlineColorClass, formatDate, relativeDeadline } from "@/lib/date-utils"
import { isPendingStatus } from "@/lib/homework-status"
import type { HomeworkStatus } from "@/generated/prisma/enums"

export function HomeworkCard({
  id,
  title,
  studentName,
  status,
  dueDate,
  subjectNames,
  isOverdue,
}: {
  id: string
  title: string
  studentName: string
  status: HomeworkStatus
  dueDate: Date
  subjectNames: string[]
  isOverdue: boolean
}) {
  const canEdit = isPendingStatus(status)

  return (
    <article className={`apple-card-surface rounded-2xl p-4 ${isOverdue ? "border-destructive/40" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/homework/${id}`} className="inline-flex min-h-11 items-center font-medium hover:underline">{title}</Link>
          <p className="mt-0.5 text-sm text-muted-foreground">{studentName}</p>
          {subjectNames.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {subjectNames.map((name) => (
                <span key={name} className="rounded-full bg-muted px-2 py-0.5 text-xs text-foreground">{name}</span>
              ))}
            </div>
          )}
        </div>
        <StatusBadge status={status} />
      </div>
      <p className={`mt-2 text-xs ${canEdit ? deadlineColorClass(dueDate) : "text-muted-foreground"}`}>
        期限: {formatDate(dueDate)}
        {canEdit && <span className="ml-1.5">（{relativeDeadline(dueDate)}）</span>}
      </p>
      <HomeworkActions
        homeworkId={id}
        canEdit={canEdit}
        showDetails
        className="mt-3 border-t pt-3"
      />
    </article>
  )
}
