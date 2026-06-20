"use client"

import { useTransition } from "react"
import Link from "next/link"
import { Pencil, Trash2 } from "lucide-react"
import { deleteHomework } from "@/app/(app)/homework/[id]/actions"
import { StatusBadge } from "@/components/homework/status-badge"
import { deadlineColorClass, relativeDeadline, formatDate } from "@/lib/date-utils"
import { haptic } from "@/lib/haptic"
import { SwipeableRow } from "@/components/ui/swipeable-row"

type Status = "assigned" | "submitted" | "approved" | "rejected"

type Props = {
  id: string
  title: string
  studentName: string
  status: Status
  dueDateStr: string
  subjectNames: string[]
  isOverdue: boolean
}

export function SwipeableHomeworkCard({
  id, title, studentName, status, dueDateStr, subjectNames, isOverdue,
}: Props) {
  const [isPending, startTransition] = useTransition()

  const canEdit = status === "assigned" || status === "rejected"
  const dueDate = new Date(dueDateStr)
  const relLabel = relativeDeadline(dueDate)
  const relColor = deadlineColorClass(dueDate)

  function handleDelete() {
    haptic.error()
    const fd = new FormData()
    fd.append("homeworkId", id)
    startTransition(async () => { await deleteHomework(fd) })
  }

  return (
    <SwipeableRow
      className={isOverdue ? "border-destructive/40" : ""}
      actionWidth={canEdit ? 112 : 64}
      onFullSwipe={handleDelete}
      actions={
        <>
          {canEdit && (
            <Link
              href={`/homework/${id}/edit`}
              className="flex-1 flex flex-col items-center justify-center gap-1 text-muted-foreground text-[11px] font-medium hover:text-foreground transition-colors"
              onClick={() => haptic.tap()}
            >
              <Pencil className="h-[18px] w-[18px]" />
              編集
            </Link>
          )}
          <button
            onClick={handleDelete}
            disabled={isPending}
            className={`flex flex-col items-center justify-center gap-1 text-destructive text-[11px] font-medium transition-opacity hover:opacity-70 disabled:opacity-50 ${canEdit ? "flex-1 border-l border-border/60" : "w-full"}`}
          >
            <Trash2 className="h-[18px] w-[18px]" />
            {isPending ? "…" : "削除"}
          </button>
        </>
      }
    >
      <Link href={`/homework/${id}`} className="block">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium truncate">{title}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{studentName}</p>
            {subjectNames.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {subjectNames.map((name) => (
                  <span key={name} className="text-xs bg-muted text-foreground rounded-full px-2 py-0.5">
                    {name}
                  </span>
                ))}
              </div>
            )}
          </div>
          <StatusBadge status={status} />
        </div>
        <p className={`text-xs mt-2 ${status === "assigned" || status === "rejected" ? relColor : "text-muted-foreground"}`}>
          期限: {formatDate(dueDate)}
          {(status === "assigned" || status === "rejected") && <span className="ml-1.5">（{relLabel}）</span>}
        </p>
      </Link>
    </SwipeableRow>
  )
}
