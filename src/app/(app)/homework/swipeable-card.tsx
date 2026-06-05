"use client"

import { useRef, useState, useTransition } from "react"
import Link from "next/link"
import { deleteHomework } from "@/app/(app)/homework/[id]/edit-actions"
import { StatusBadge } from "@/components/homework/status-badge"
import { deadlineColorClass, relativeDeadline } from "@/lib/date-utils"

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

const ACTION_WIDTH = 130

export function SwipeableHomeworkCard({
  id, title, studentName, status, dueDateStr, subjectNames, isOverdue,
}: Props) {
  const [offset, setOffset] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const startX = useRef(0)
  const baseOffset = useRef(0)
  const isDragging = useRef(false)
  const didSwipe = useRef(false)

  const canEdit = status === "assigned" || status === "rejected"
  const dueDate = new Date(dueDateStr)
  const relLabel = relativeDeadline(dueDate)
  const relColor = deadlineColorClass(dueDate)

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    isDragging.current = true
    didSwipe.current = false
    startX.current = e.clientX
    baseOffset.current = offset
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging.current) return
    const dx = e.clientX - startX.current
    if (Math.abs(dx) > 5) didSwipe.current = true
    const newOffset = Math.max(-ACTION_WIDTH, Math.min(0, baseOffset.current + dx))
    setOffset(newOffset)
  }

  function handlePointerUp() {
    if (!isDragging.current) return
    isDragging.current = false
    const snapOpen = offset < -(ACTION_WIDTH / 2)
    setOffset(snapOpen ? -ACTION_WIDTH : 0)
    setIsOpen(snapOpen)
  }

  function handleCardClick(e: React.MouseEvent) {
    if (isOpen) {
      e.preventDefault()
      setOffset(0)
      setIsOpen(false)
      return
    }
    if (didSwipe.current) {
      e.preventDefault()
      didSwipe.current = false
    }
  }

  function handleDelete() {
    const fd = new FormData()
    fd.append("homeworkId", id)
    startTransition(async () => { await deleteHomework(fd) })
  }

  return (
    <div className="relative rounded-lg overflow-hidden">
      {/* アクションボタン（スワイプで露出） */}
      <div className="absolute inset-y-0 right-0 flex" style={{ width: ACTION_WIDTH }}>
        {canEdit && (
          <Link
            href={`/homework/${id}/edit`}
            className="flex-1 flex items-center justify-center bg-primary/90 text-primary-foreground text-sm font-medium hover:bg-primary transition-colors"
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
      </div>

      {/* カード本体 */}
      <div
        className={`rounded-lg border bg-card p-4 select-none ${isOverdue ? "border-red-200 bg-destructive/5" : ""}`}
        style={{
          transform: `translateX(${offset}px)`,
          transition: isDragging.current ? "none" : "transform 0.2s ease-out",
          touchAction: "pan-y",
          willChange: "transform",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <Link href={`/homework/${id}`} onClick={handleCardClick} className="block">
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
      </div>
    </div>
  )
}
