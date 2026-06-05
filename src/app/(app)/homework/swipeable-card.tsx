"use client"

import { useTransition } from "react"
import Link from "next/link"
import { deleteHomework } from "@/app/(app)/homework/[id]/edit-actions"
import { StatusBadge } from "@/components/homework/status-badge"
import { deadlineColorClass, relativeDeadline } from "@/lib/date-utils"
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
  showHint?: boolean
}

export function SwipeableHomeworkCard({
  id, title, studentName, status, dueDateStr, subjectNames, isOverdue, showHint = false,
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
      showHint={showHint}
      className={isOverdue ? "border-destructive/30 bg-destructive/5" : ""}
      actions={
        <>
          {canEdit && (
            <Link
              href={`/homework/${id}/edit`}
              className="flex-1 flex items-center justify-center bg-primary/90 text-primary-foreground text-sm font-medium hover:bg-primary transition-colors"
              onClick={() => haptic.tap()}
            >
              編集
            </Link>
          )}
          <button
            onClick={handleDelete}
            disabled={isPending}
            className={`flex items-center justify-center bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50 ${canEdit ? "flex-1" : "w-full"}`}
          >
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
        <p className={`text-xs mt-2 ${status === "assigned" ? relColor : "text-muted-foreground"}`}>
          期限: {dueDate.toLocaleDateString("ja-JP")}
          {status === "assigned" && <span className="ml-1.5">（{relLabel}）</span>}
        </p>
      </Link>
    </SwipeableRow>
  )
}
