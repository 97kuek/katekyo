"use client"

import Link from "next/link"
import { useActionState, useState } from "react"
import { CalendarClock, Pencil, Trash2 } from "lucide-react"
import { deleteHomework, extendDueDate } from "./actions"
import { Button, buttonVariants } from "@/components/ui/button"
import { InlineConfirmAction } from "@/components/ui/inline-confirm-action"
import { Input } from "@/components/ui/input"

export function HomeworkDetailActions({
  homeworkId,
  currentDueDate,
  canEdit,
}: {
  homeworkId: string
  currentDueDate: string
  canEdit: boolean
}) {
  const [changingDeadline, setChangingDeadline] = useState(false)
  const [state, action, isPending] = useActionState(
    async (previous: { error: string; success: boolean }, formData: FormData) => {
      const result = await extendDueDate(previous, formData)
      if (result.success) setChangingDeadline(false)
      return result
    },
    { error: "", success: false }
  )

  return (
    <section aria-labelledby="homework-actions-title" className="rounded-lg border bg-card p-4">
      <h2 id="homework-actions-title" className="text-sm font-semibold">宿題の操作</h2>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {canEdit && (
          <Link href={`/homework/${homeworkId}/edit`} className={buttonVariants({ variant: "outline", size: "sm" })}>
            <Pencil aria-hidden />編集
          </Link>
        )}
        <Button type="button" variant="outline" size="sm" onClick={() => setChangingDeadline((open) => !open)}>
          <CalendarClock aria-hidden />期限を延長
        </Button>
        <InlineConfirmAction
          triggerLabel="削除"
          confirmLabel="削除する"
          pendingLabel="削除中..."
          message="この宿題を削除しますか？"
          triggerVariant="outline"
          triggerSize="sm"
          triggerIcon={<Trash2 aria-hidden />}
          onConfirm={async () => {
            const formData = new FormData()
            formData.set("homeworkId", homeworkId)
            await deleteHomework(formData)
          }}
        />
      </div>

      {changingDeadline && (
        <form action={action} className="mt-4 grid gap-2 border-t pt-4 sm:grid-cols-[minmax(0,12rem)_auto_auto] sm:items-center">
          <input type="hidden" name="id" value={homeworkId} />
          <Input name="dueDate" type="date" required defaultValue={currentDueDate} aria-label="新しい期限" className="md:h-10" />
          <Button type="submit" size="sm" disabled={isPending} className="h-10">
            {isPending ? "更新中..." : "期限を更新"}
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-10" onClick={() => setChangingDeadline(false)}>
            キャンセル
          </Button>
          {state.error && <p className="text-xs text-destructive sm:col-span-3">{state.error}</p>}
        </form>
      )}
    </section>
  )
}
