"use client"

import { useActionState, useState } from "react"
import { unlinkParent } from "./actions"
import { Button } from "@/components/ui/button"

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
          <input type="hidden" name="parentId" value={parentId} />
          <input type="hidden" name="studentId" value={studentId} />
          <button
            type="submit"
            disabled={isPending}
            className="text-xs font-medium text-destructive hover:text-destructive/80 disabled:opacity-50"
          >
            {isPending ? "解除中..." : `${parentName}を解除`}
          </button>
        </form>
        <button onClick={() => setConfirming(false)} className="text-xs text-muted-foreground hover:text-foreground">
          キャンセル
        </button>
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
