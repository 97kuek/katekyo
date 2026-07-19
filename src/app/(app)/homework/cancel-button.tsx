"use client"

import { useState, useTransition } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { cancelSubmission } from "./[id]/actions"
import { haptic } from "@/lib/haptic"
import { Button } from "@/components/ui/button"

export function CancelSubmissionButton({ homeworkId }: { homeworkId: string }) {
  const [isPending, startTransition] = useTransition()
  const [isConfirming, setIsConfirming] = useState(false)

  function handleClick() {
    haptic.tap()
    startTransition(async () => {
      try {
        const fd = new FormData()
        fd.append("homeworkId", homeworkId)
        await cancelSubmission(fd)
        toast.success("宿題の提出を取り消しました")
        setIsConfirming(false)
      } catch {
        toast.error("提出を取り消せませんでした。もう一度お試しください。")
      }
    })
  }

  if (!isConfirming) {
    return (
      <Button type="button" variant="ghost" size="sm" onClick={() => setIsConfirming(true)} className="text-muted-foreground hover:text-destructive">
        提出を取り消す
      </Button>
    )
  }

  return (
    <div role="group" aria-label="提出取消の確認" className="flex flex-wrap items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-2">
      <span className="text-xs text-muted-foreground">コメントや写真も削除されます。</span>
      <Button type="button" variant="destructive" size="sm" onClick={handleClick} disabled={isPending}>
        {isPending ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />取消中</> : "取り消す"}
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={() => setIsConfirming(false)} disabled={isPending}>戻る</Button>
    </div>
  )
}
