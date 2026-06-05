"use client"

import { useTransition } from "react"
import { deleteHomework } from "./edit-actions"
import { Button } from "@/components/ui/button"

export function DeleteHomeworkButton({ homeworkId }: { homeworkId: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => startTransition(async () => {
        const fd = new FormData()
        fd.append("homeworkId", homeworkId)
        await deleteHomework(fd)
      })}
      className="text-destructive border-input hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
    >
      {isPending ? "削除中..." : "削除"}
    </Button>
  )
}
