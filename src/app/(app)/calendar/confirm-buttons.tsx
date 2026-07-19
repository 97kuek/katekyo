"use client"

import { deleteExamEvent, deleteLesson } from "./actions"
import { InlineConfirmAction } from "@/components/ui/inline-confirm-action"
import { Trash2 } from "lucide-react"

export function DeleteLessonButton({ lessonId }: { lessonId: string }) {
  return (
    <InlineConfirmAction
      triggerLabel="削除"
      confirmLabel="削除する"
      pendingLabel="削除中..."
      message="この授業を削除しますか？"
      triggerIcon={<Trash2 aria-hidden />}
      onConfirm={async () => {
        const formData = new FormData()
        formData.set("lessonId", lessonId)
        await deleteLesson(formData)
      }}
    />
  )
}

export function DeleteExamEventButton({ examEventId }: { examEventId: string }) {
  return (
    <InlineConfirmAction
      triggerLabel="削除"
      confirmLabel="削除する"
      pendingLabel="削除中..."
      message="このテスト予定を削除しますか？"
      triggerIcon={<Trash2 aria-hidden />}
      onConfirm={async () => {
        const formData = new FormData()
        formData.set("examEventId", examEventId)
        await deleteExamEvent(formData)
      }}
    />
  )
}
