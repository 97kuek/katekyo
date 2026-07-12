"use client"

import { useState, useTransition } from "react"
import { RotateCcw, Trash2 } from "lucide-react"
import { deleteLesson, deleteExamEvent, uncompleteLesson } from "./actions"
import { Button } from "@/components/ui/button"

export function DeleteLessonButton({ lessonId }: { lessonId: string }) {
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5 shrink-0 bg-destructive/10 rounded-md px-2 py-1">
        <span className="text-xs text-muted-foreground">削除?</span>
        <button
          onClick={() => startTransition(async () => {
            const fd = new FormData()
            fd.append("lessonId", lessonId)
            await deleteLesson(fd)
          })}
          disabled={isPending}
          className="text-xs font-medium text-destructive hover:text-destructive/80 disabled:opacity-50"
        >
          {isPending ? "..." : "はい"}
        </button>
        <button onClick={() => setConfirming(false)} className="text-xs text-muted-foreground hover:text-foreground">
          ✕
        </button>
      </div>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => setConfirming(true)}
      className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
      title="削除"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}

export function UncompleteLessonButton({ lessonId }: { lessonId: string }) {
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5 shrink-0 bg-muted rounded-md px-2 py-1">
        <span className="text-xs text-muted-foreground">取消?</span>
        <button
          onClick={() => startTransition(async () => {
            const fd = new FormData()
            fd.append("lessonId", lessonId)
            await uncompleteLesson(fd)
          })}
          disabled={isPending}
          className="text-xs font-medium text-foreground hover:text-primary disabled:opacity-50"
        >
          {isPending ? "..." : "はい"}
        </button>
        <button onClick={() => setConfirming(false)} className="text-xs text-muted-foreground hover:text-foreground">
          ✕
        </button>
      </div>
    )
  }

  return (
    <Button variant="ghost" size="icon-sm" onClick={() => setConfirming(true)} title="完了を取り消し">
      <RotateCcw className="h-4 w-4" />
    </Button>
  )
}

export function DeleteExamEventButton({ examEventId }: { examEventId: string }) {
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-xs text-muted-foreground">削除?</span>
        <button
          onClick={() => startTransition(async () => {
            const fd = new FormData()
            fd.append("examEventId", examEventId)
            await deleteExamEvent(fd)
          })}
          disabled={isPending}
          className="text-xs font-medium text-destructive hover:text-destructive/80 disabled:opacity-50"
        >
          {isPending ? "削除中..." : "削除"}
        </button>
        <button onClick={() => setConfirming(false)} className="text-xs text-muted-foreground hover:text-foreground">
          ✕
        </button>
      </div>
    )
  }
  return (
    <button onClick={() => setConfirming(true)} className="text-xs text-muted-foreground hover:text-foreground shrink-0">
      削除
    </button>
  )
}
