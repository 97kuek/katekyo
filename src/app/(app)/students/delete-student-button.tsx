"use client"

import { useTransition, useState } from "react"
import { deleteStudent } from "./actions"
import { Button } from "@/components/ui/button"

export function DeleteStudentButton({ studentId, studentName }: { studentId: string; studentName: string }) {
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">宿題・成績も削除されます</span>
        <button
          onClick={() => startTransition(async () => {
            const fd = new FormData()
            fd.append("studentId", studentId)
            await deleteStudent(fd)
          })}
          disabled={isPending}
          className="text-xs font-medium text-destructive hover:text-destructive/80 disabled:opacity-50"
        >
          {isPending ? "削除中..." : `${studentName}を削除`}
        </button>
        <button onClick={() => setConfirming(false)} className="text-xs text-muted-foreground hover:text-foreground">
          キャンセル
        </button>
      </div>
    )
  }

  return (
    <Button
      variant="ghost"
      size="xs"
      onClick={() => setConfirming(true)}
      className="text-destructive hover:text-destructive hover:bg-destructive/10"
    >
      削除
    </Button>
  )
}
