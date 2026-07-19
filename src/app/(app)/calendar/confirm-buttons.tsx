"use client"

import { deleteExamEvent, deleteLesson, uncompleteLesson } from "./actions"
import { InlineConfirmAction } from "@/components/ui/inline-confirm-action"

export function DeleteLessonButton({ lessonId }: { lessonId: string }) {
  return (
    <InlineConfirmAction
      triggerLabel="削除"
      confirmLabel="削除する"
      pendingLabel="削除中..."
      message="この授業を削除しますか？"
      onConfirm={async () => {
        const formData = new FormData()
        formData.set("lessonId", lessonId)
        await deleteLesson(formData)
      }}
    />
  )
}

export function UncompleteLessonButton({ lessonId }: { lessonId: string }) {
  return (
    <InlineConfirmAction
      triggerLabel="完了取消"
      confirmLabel="取り消す"
      pendingLabel="処理中..."
      message="授業を未完了へ戻しますか？"
      destructive={false}
      onConfirm={async () => {
        const formData = new FormData()
        formData.set("lessonId", lessonId)
        await uncompleteLesson(formData)
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
      onConfirm={async () => {
        const formData = new FormData()
        formData.set("examEventId", examEventId)
        await deleteExamEvent(formData)
      }}
    />
  )
}
