"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { cancelSubmission } from "./[id]/cancel-actions"

export function CancelSubmissionButton({ homeworkId }: { homeworkId: string }) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (!confirm("提出を取り消しますか？やり直しが必要な場合は取り消してください。")) return
    startTransition(async () => {
      const fd = new FormData()
      fd.append("homeworkId", homeworkId)
      await cancelSubmission(fd)
      toast.success("提出を取り消しました")
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="text-xs text-muted-foreground hover:text-destructive underline underline-offset-2 transition-colors disabled:opacity-50"
    >
      {isPending ? "取り消し中..." : "提出を取り消す"}
    </button>
  )
}
