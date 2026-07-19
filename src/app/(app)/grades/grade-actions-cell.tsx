"use client"

import Link from "next/link"
import { deleteGradeRecord } from "./[id]/actions"
import { InlineConfirmAction } from "@/components/ui/inline-confirm-action"
import { buttonVariants } from "@/components/ui/button"

export function GradeActionsCell({
  gradeId,
  size = "xs",
  className = "",
}: {
  gradeId: string
  size?: "xs" | "sm"
  className?: string
}) {
  return (
    <div className={`flex flex-wrap items-center justify-end gap-2 ${className}`}>
      <Link href={`/grades/${gradeId}/edit`} className={buttonVariants({ variant: "ghost", size, className: "text-primary" })}>
        編集
      </Link>
      <InlineConfirmAction
        triggerLabel="削除"
        confirmLabel="削除する"
        message="この成績記録を削除しますか？"
        triggerSize={size}
        onConfirm={async () => {
          const formData = new FormData()
          formData.set("gradeId", gradeId)
          await deleteGradeRecord(formData)
        }}
      />
    </div>
  )
}
