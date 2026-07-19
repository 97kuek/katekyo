"use client"

import { useState, useTransition } from "react"
import { Check } from "lucide-react"
import { toast } from "sonner"
import { completeLesson, uncompleteLesson } from "./actions"
import { Button } from "@/components/ui/button"
import { PendingStatus } from "@/components/ui/pending-status"
import { haptic } from "@/lib/haptic"

export function LessonCompletionControl({ lessonId, completed }: { lessonId: string; completed: boolean }) {
  const [isCompleted, setIsCompleted] = useState(completed)
  const [previousCompleted, setPreviousCompleted] = useState(completed)
  const [isPending, startTransition] = useTransition()

  if (completed !== previousCompleted) {
    setPreviousCompleted(completed)
    setIsCompleted(completed)
  }

  function persist(next: boolean, announce = true) {
    setIsCompleted(next)
    if (next) haptic.success()
    else haptic.tap()
    startTransition(async () => {
      const formData = new FormData()
      formData.set("lessonId", lessonId)
      if (next) await completeLesson(formData)
      else await uncompleteLesson(formData)

      if (announce) {
        toast.success(next ? "授業を完了にしました" : "授業を未完了に戻しました", {
          action: {
            label: "元に戻す",
            onClick: () => persist(!next, false),
          },
        })
      }
    })
  }

  return (
    <>
      <PendingStatus pending={isPending} label="授業の状態を更新しています" />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={isCompleted ? "授業を未完了に戻す" : "授業を完了にする"}
        aria-pressed={isCompleted}
        aria-busy={isPending}
        className={`shrink-0 rounded-full border-2 transition-[color,background-color,border-color,transform] ${
          isCompleted
            ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
            : "border-border bg-background text-transparent hover:border-primary/55 hover:bg-primary/5"
        }`}
        onClick={() => persist(!isCompleted)}
      >
        <Check aria-hidden />
      </Button>
    </>
  )
}
