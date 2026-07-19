"use client"

import { deleteStudent } from "./actions"
import { InlineConfirmAction } from "@/components/ui/inline-confirm-action"

export function DeleteStudentButton({ studentId, studentName }: { studentId: string; studentName: string }) {
  return (
    <InlineConfirmAction
      triggerLabel="削除"
      confirmLabel={`${studentName}を削除`}
      pendingLabel="削除中..."
      message="宿題・成績を含む生徒データを削除します。"
      onConfirm={async () => {
        const formData = new FormData()
        formData.set("studentId", studentId)
        await deleteStudent(formData)
      }}
    />
  )
}
