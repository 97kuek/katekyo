"use client"

import { useTransition } from "react"
import { deleteHomework } from "./actions"
import { Button } from "@/components/ui/button"

export function DeleteHomeworkButton({ homeworkId }: { homeworkId: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      variant="ghost"
      size="xs"
      disabled={isPending}
      onClick={() => startTransition(async () => {
        const fd = new FormData()
        fd.append("homeworkId", homeworkId)
        await deleteHomework(fd)
      })}
      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
    >
      {isPending ? "削除中..." : "削除"}
    </Button>
  )
}
