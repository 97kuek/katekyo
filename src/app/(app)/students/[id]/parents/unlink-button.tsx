"use client"

import { useActionState, useState } from "react"
import { unlinkParent } from "./actions"
import { Button } from "@/components/ui/button"
import { PendingStatus } from "@/components/ui/pending-status"

export function UnlinkParentButton({ parentId, studentId, parentName }: {
  parentId: string
  studentId: string
  parentName: string
}) {
  const [confirming, setConfirming] = useState(false)
  const [state, action, isPending] = useActionState(unlinkParent, { error: "" })

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">本当に解除しますか？</span>
        <form action={action} className="flex items-center gap-2">
          <PendingStatus pending={isPending} label="保護者の連携を解除しています" />
          <input type="hidden" name="parentId" value={parentId} />
          <input type="hidden" name="studentId" value={studentId} />
          <Button
            type="submit"
            variant="destructive"
            size="xs"
            disabled={isPending}
          >
            {isPending ? "解除中..." : `${parentName}を解除`}
          </Button>
        </form>
        <Button type="button" variant="outline" size="xs" onClick={() => setConfirming(false)}>
          キャンセル
        </Button>
        {state.error && <span className="text-xs text-destructive">{state.error}</span>}
      </div>
    )
  }

  return (
    <Button
      variant="ghost"
      size="xs"
      onClick={() => setConfirming(true)}
      className="text-destructive hover:text-destructive hover:bg-muted"
    >
      解除
    </Button>
  )
}
