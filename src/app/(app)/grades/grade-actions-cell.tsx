"use client"

import Link from "next/link"
import { deleteGradeRecord } from "./[id]/actions"
import { InlineConfirmAction } from "@/components/ui/inline-confirm-action"

export function GradeActionsCell({ gradeId }: { gradeId: string }) {
  return (
    <div className="flex items-center justify-end gap-3">
      <Link href={`/grades/${gradeId}/edit`} className="text-xs text-primary hover:underline">
        編集
      </Link>
      <InlineConfirmAction
        triggerLabel="削除"
        confirmLabel="削除する"
        message="この成績記録を削除しますか？"
        onConfirm={async () => {
          const formData = new FormData()
          formData.set("gradeId", gradeId)
          await deleteGradeRecord(formData)
        }}
      />
    </div>
  )
}
