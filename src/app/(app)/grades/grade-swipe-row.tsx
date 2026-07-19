"use client"

import { useState, useTransition } from "react"
import { deleteGradeRecord } from "./[id]/actions"
import { haptic } from "@/lib/haptic"
import { SwipeableRow } from "@/components/ui/swipeable-row"
import { SwipeEditDeleteActions } from "@/components/ui/swipe-edit-delete-actions"
import { RowActions } from "@/components/ui/row-actions"

export function GradeSwipeRow({ gradeId, children }: { gradeId: string; children: React.ReactNode }) {
  const [isPending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)

  function handleDelete() {
    haptic.error()
    const fd = new FormData()
    fd.append("gradeId", gradeId)
    startTransition(async () => {
      await deleteGradeRecord(fd)
    })
  }

  return (
    <SwipeableRow
      actionWidth={176}
      onOpenChange={(open) => {
        if (!open) setConfirming(false)
      }}
      actions={
        <SwipeEditDeleteActions
          editHref={`/grades/${gradeId}/edit`}
          confirming={confirming}
          onConfirmingChange={setConfirming}
          isPending={isPending}
          onDelete={handleDelete}
        />
      }
    >
      <div className="relative pb-7">
        {children}
        <RowActions editHref={`/grades/${gradeId}/edit`} confirming={confirming} onConfirmingChange={setConfirming} isPending={isPending} onDelete={handleDelete} className="absolute bottom-0 right-0" />
      </div>
    </SwipeableRow>
  )
}
