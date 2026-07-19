"use client"

import { deleteSubject } from "./actions"
import { InlineConfirmAction } from "@/components/ui/inline-confirm-action"

export function DeleteSubjectButton({ id }: { id: string }) {
  return (
    <InlineConfirmAction
      triggerLabel="削除"
      confirmLabel="削除する"
      pendingLabel="削除中..."
      message="この科目タグを削除しますか？"
      onConfirm={async () => {
        const formData = new FormData()
        formData.set("id", id)
        await deleteSubject(formData)
      }}
    />
  )
}
