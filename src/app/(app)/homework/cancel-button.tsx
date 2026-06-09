"use client"

import { useTransition } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { cancelSubmission } from "./[id]/actions"
import { haptic } from "@/lib/haptic"

export function CancelSubmissionButton({ homeworkId }: { homeworkId: string }) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    haptic.tap()
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
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive underline underline-offset-2 transition-colors disabled:opacity-50"
    >
      {isPending
        ? <><Loader2 className="h-3 w-3 animate-spin" />取り消し中...</>
        : "提出を取り消す"
      }
    </button>
  )
}
