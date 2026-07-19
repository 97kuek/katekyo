"use client"

import { useActionState, useState, useTransition } from "react"
import { CalendarClock, Pencil, Trash2 } from "lucide-react"
import { deleteHomework, extendDueDate } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PendingStatus } from "@/components/ui/pending-status"
import { ActionButton, ActionLink, ActionList } from "@/components/ui/action-list"

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
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [isDeleting, startDeleting] = useTransition()
  const [state, action, isPending] = useActionState(
    async (previous: { error: string; success: boolean }, formData: FormData) => {
      const result = await extendDueDate(previous, formData)
      if (result.success) setChangingDeadline(false)
      return result
    },
    { error: "", success: false }
  )

  function handleDelete() {
    startDeleting(async () => {
      const formData = new FormData()
      formData.set("homeworkId", homeworkId)
      await deleteHomework(formData)
    })
  }

  return (
    <section aria-labelledby="homework-actions-title" className="space-y-2">
      <h2 id="homework-actions-title" className="px-1 text-xs font-semibold text-muted-foreground">宿題の操作</h2>
      <ActionList>
        {canEdit && (
          <ActionLink
            href={`/homework/${homeworkId}/edit`}
            icon={<Pencil aria-hidden />}
            label="宿題を編集"
            description="タイトル・内容・教材などを変更"
          />
        )}
        <ActionButton
          icon={<CalendarClock aria-hidden />}
          label="期限を変更"
          description="現在の期限を別の日付へ変更"
          expanded={changingDeadline}
          onClick={() => { setChangingDeadline((open) => !open); setConfirmingDelete(false) }}
        />
        <ActionButton
          icon={<Trash2 aria-hidden />}
          label="宿題を削除"
          description="記録と提出履歴を完全に削除"
          destructive
          expanded={confirmingDelete}
          onClick={() => { setConfirmingDelete((open) => !open); setChangingDeadline(false) }}
        />
      </ActionList>

      {changingDeadline && (
        <form action={action} className="apple-card-surface grid gap-3 rounded-2xl p-4 sm:grid-cols-[minmax(0,12rem)_auto_auto] sm:items-end">
          <PendingStatus pending={isPending} label="宿題の期限を更新しています" />
          <input type="hidden" name="id" value={homeworkId} />
          <div className="space-y-1">
            <Label htmlFor="homework-due-date" className="text-xs">新しい期限（必須）</Label>
            <Input id="homework-due-date" name="dueDate" type="date" required defaultValue={currentDueDate} className="md:h-10" />
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? "更新中..." : "期限を更新"}
          </Button>
          <Button type="button" variant="outline" onClick={() => setChangingDeadline(false)}>
            キャンセル
          </Button>
          {state.error && <p className="text-xs text-destructive sm:col-span-3">{state.error}</p>}
        </form>
      )}

      {confirmingDelete && (
        <div className="rounded-2xl border border-destructive/25 bg-destructive/5 p-4">
          <PendingStatus pending={isDeleting} label="宿題を削除しています" />
          <p className="text-sm font-semibold text-destructive">この宿題を削除しますか？</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">提出履歴を含めて削除され、この操作は取り消せません。</p>
          <div className="mt-3 flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" disabled={isDeleting} onClick={() => setConfirmingDelete(false)}>キャンセル</Button>
            <Button type="button" variant="destructive" size="sm" disabled={isDeleting} onClick={handleDelete}>{isDeleting ? "削除中..." : "削除する"}</Button>
          </div>
        </div>
      )}
    </section>
  )
}
