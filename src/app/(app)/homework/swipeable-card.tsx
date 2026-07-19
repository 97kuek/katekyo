"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { deleteHomework } from "@/app/(app)/homework/[id]/actions"
import { StatusBadge } from "@/components/homework/status-badge"
import { deadlineColorClass, relativeDeadline, formatDate } from "@/lib/date-utils"
import { isPendingStatus } from "@/lib/homework-status"
import { haptic } from "@/lib/haptic"
import { SwipeableRow } from "@/components/ui/swipeable-row"
import { SwipeEditDeleteActions } from "@/components/ui/swipe-edit-delete-actions"
import type { HomeworkStatus } from "@/generated/prisma/enums"
import { RowActions } from "@/components/ui/row-actions"

type Props = {
  id: string
  title: string
  studentName: string
  status: HomeworkStatus
  dueDateStr: string
  subjectNames: string[]
  isOverdue: boolean
}

export function SwipeableHomeworkCard({
  id, title, studentName, status, dueDateStr, subjectNames, isOverdue,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)

  const canEdit = isPendingStatus(status)
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
      actionWidth={176}
      onOpenChange={(open) => {
        if (!open) setConfirming(false)
      }}
      actions={
        <SwipeEditDeleteActions
          editHref={canEdit ? `/homework/${id}/edit` : undefined}
          confirming={confirming}
          onConfirmingChange={setConfirming}
          isPending={isPending}
          onDelete={handleDelete}
        />
      }
    >
      <div className="relative">
      <Link href={`/homework/${id}`} className="block pb-7">
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
        <p className={`text-xs mt-2 ${canEdit ? relColor : "text-muted-foreground"}`}>
          期限: {formatDate(dueDate)}
          {canEdit && <span className="ml-1.5">（{relLabel}）</span>}
        </p>
      </Link>
      <RowActions editHref={canEdit ? `/homework/${id}/edit` : undefined} confirming={confirming} onConfirmingChange={setConfirming} isPending={isPending} onDelete={handleDelete} className="absolute bottom-0 right-0" />
      </div>
    </SwipeableRow>
  )
}
