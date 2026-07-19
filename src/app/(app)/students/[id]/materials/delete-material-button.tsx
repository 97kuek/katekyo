"use client"

import { deleteMaterial } from "./actions"
import { InlineConfirmAction } from "@/components/ui/inline-confirm-action"

export function DeleteMaterialButton({ materialId, studentId }: { materialId: string; studentId: string }) {
  return (
    <InlineConfirmAction
      triggerLabel="削除"
      confirmLabel="削除する"
      message="この教材を削除しますか？"
      pendingLabel="削除中..."
      onConfirm={async () => { await deleteMaterial(materialId, studentId) }}
    />
  )
}
