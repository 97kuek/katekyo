"use client"

import Link from "next/link"
import { Eye, Pencil } from "lucide-react"
import { deleteHomework } from "./[id]/actions"
import { buttonVariants } from "@/components/ui/button"
import { InlineConfirmAction } from "@/components/ui/inline-confirm-action"

export function HomeworkActions({
  homeworkId,
  canEdit,
  showDetails = false,
  size = "sm",
  className = "",
}: {
  homeworkId: string
  canEdit: boolean
  showDetails?: boolean
  size?: "xs" | "sm"
  className?: string
}) {
  return (
    <div className={`flex flex-wrap items-center justify-end gap-2 ${className}`}>
      {showDetails && (
        <Link href={`/homework/${homeworkId}`} className={buttonVariants({ variant: "outline", size })}>
          <Eye aria-hidden />詳細
        </Link>
      )}
      {canEdit && (
        <Link href={`/homework/${homeworkId}/edit`} className={buttonVariants({ variant: "outline", size })}>
          <Pencil aria-hidden />編集
        </Link>
      )}
      <InlineConfirmAction
        triggerLabel="削除"
        confirmLabel="削除する"
        pendingLabel="削除中..."
        message="この宿題を削除しますか？"
        triggerSize={size}
        onConfirm={async () => {
          const formData = new FormData()
          formData.set("homeworkId", homeworkId)
          await deleteHomework(formData)
        }}
      />
    </div>
  )
}
