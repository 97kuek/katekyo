"use client"

import { useState, useActionState, useTransition } from "react"
import { createExamEvent, completeLesson, createHomeworkFromCalendar } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { TEST_TYPE_OPTIONS } from "@/lib/test-types"
import { toast } from "sonner"
import type { Student } from "./calendar-types"

export function CompleteLessonLogForm({ lessonId, onClose }: { lessonId: string; onClose: () => void }) {
  const [log, setLog] = useState("")
  const [isPending, startTransition] = useTransition()

  function submit(withLog: boolean) {
    startTransition(async () => {
      const fd = new FormData()
      fd.append("lessonId", lessonId)
      if (withLog && log.trim()) fd.append("lessonLog", log.trim())
      await completeLesson(fd)
      onClose()
    })
  }

  return (
    <div className="mt-2 pt-2 border-t space-y-2">
      <p className="text-xs font-medium text-primary">授業ログを残す（任意）</p>
      <Textarea
        value={log}
        onChange={(e) => setLog(e.target.value)}
        placeholder="今日の授業メモ..."
        rows={2}
        autoFocus
        className="min-h-20 resize-none md:min-h-14 md:text-xs"
      />
      <div className="flex gap-2">
        <Button
          onClick={() => submit(true)}
          disabled={isPending}
          size="xs"
        >
          {isPending ? "完了中..." : "完了にする"}
        </Button>
        <Button onClick={() => submit(false)} disabled={isPending} variant="ghost" size="xs">
          スキップ
        </Button>
        <Button type="button" onClick={onClose} variant="outline" size="xs" className="ml-auto">
          キャンセル
        </Button>
      </div>
    </div>
  )
}

export function HomeworkForm({ students, defaultDate, embedded = false, onClose }: { students: Student[]; defaultDate: string; embedded?: boolean; onClose?: () => void }) {
  const [open, setOpen] = useState(embedded)
  const [state, action, isPending] = useActionState(
    async (prev: { error: string; timestamp?: number }, formData: FormData) => {
      const result = await createHomeworkFromCalendar(prev, formData)
      if (result.timestamp) {
        setOpen(false)
        onClose?.()
        toast.success("宿題を追加しました")
      }
      return result
    },
    { error: "" }
  )

  if (!open && !embedded) {
    return (
      <Button onClick={() => setOpen(true)} size="sm" variant="outline">
        宿題を追加
      </Button>
    )
  }

  if (!open) return null

  return (
    <div className="rounded-lg border bg-card p-3 space-y-3 w-full">
      <h3 className="font-medium text-sm">宿題を追加</h3>
      <form action={action} className="space-y-3">
        {state.error && <p className="text-xs text-foreground border border-destructive/30 bg-destructive/10 p-2 rounded">{state.error}</p>}
        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-xs">生徒</Label>
            {students.length === 1 ? (
              <>
                <input type="hidden" name="studentId" value={students[0].id} />
                <p className="text-sm py-1.5 px-3 rounded-md border bg-muted">{students[0].user.name}（{students[0].grade}）</p>
              </>
            ) : (
              <Select
                name="studentId"
                required
                className="md:h-9"
              >
                <option value="">選択してください</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.user.name}（{s.grade}）</option>
                ))}
              </Select>
            )}
          </div>
          <div className="space-y-1">
            <Label className="text-xs">タイトル</Label>
            <Input name="title" placeholder="例: 数学 p.30-35" required className="md:h-9" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">期限</Label>
            <Input name="dueDate" type="date" required defaultValue={defaultDate} className="md:h-9" />
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? "追加中..." : "追加"}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => { setOpen(false); onClose?.() }}>
            キャンセル
          </Button>
        </div>
      </form>
    </div>
  )
}

export function ExamEventForm({ students, defaultDate, embedded = false, onClose }: { students: Student[]; defaultDate: string; embedded?: boolean; onClose?: () => void }) {
  const [open, setOpen] = useState(embedded)
  const [state, action, isPending] = useActionState(
    async (prev: { error: string; timestamp?: number }, formData: FormData) => {
      const result = await createExamEvent(prev, formData)
      if (result.timestamp) {
        setOpen(false)
        onClose?.()
        toast.success("テストを追加しました")
      }
      return result
    },
    { error: "" }
  )

  if (!open && !embedded) {
    return (
      <Button onClick={() => setOpen(true)} size="sm" variant="outline">
        テストを追加
      </Button>
    )
  }

  if (!open) return null

  return (
    <div className="rounded-lg border bg-card p-3 space-y-3 w-full">
      <h3 className="font-medium text-sm">テストを追加</h3>
      <form action={action} className="space-y-3">
        {state.error && (
          <p className="text-xs text-foreground border border-destructive/30 bg-destructive/10 p-2 rounded">{state.error}</p>
        )}
        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-xs">生徒</Label>
            {students.length === 1 ? (
              <>
                <input type="hidden" name="studentId" value={students[0].id} />
                <p className="text-sm py-1.5 px-3 rounded-md border bg-muted">{students[0].user.name}（{students[0].grade}）</p>
              </>
            ) : (
              <Select
                name="studentId"
                required
                className="md:h-9"
              >
                <option value="">選択してください</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.user.name}（{s.grade}）</option>
                ))}
              </Select>
            )}
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">開始日</Label>
              <Input name="date" type="date" required defaultValue={defaultDate} className="md:h-9" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">終了日（任意）</Label>
              <Input name="endDate" type="date" className="md:h-9" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">テスト名</Label>
            <Input name="name" placeholder="例: 英語期末テスト" required className="md:h-9" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">種別</Label>
            <Select
              name="testType"
              defaultValue="exam"
              className="md:h-9"
            >
              {TEST_TYPE_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? "追加中..." : "追加"}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => { setOpen(false); onClose?.() }}>
            キャンセル
          </Button>
        </div>
      </form>
    </div>
  )
}
