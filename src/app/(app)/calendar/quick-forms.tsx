"use client"

import { useState, useActionState, useId } from "react"
import { createExamEvent, createHomeworkFromCalendar } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { PendingStatus } from "@/components/ui/pending-status"
import { FormField } from "@/components/ui/form-field"
import { FormMessage } from "@/components/ui/form-message"
import { FormProgress } from "@/components/ui/form-progress"
import { TEST_TYPE_OPTIONS } from "@/lib/test-types"
import { toast } from "sonner"
import type { Student } from "./calendar-types"
import { Plus, X } from "lucide-react"

export function HomeworkForm({ students, defaultDate, embedded = false, onClose }: { students: Student[]; defaultDate: string; embedded?: boolean; onClose?: () => void }) {
  const fieldPrefix = useId().replaceAll(":", "")
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
    <section className="w-full min-w-0 rounded-xl border border-border/60 bg-background/70 p-3">
      <div className="mb-3 flex min-w-0 items-center justify-between gap-2">
        <h3 className="truncate text-sm font-semibold">宿題を追加</h3>
        <Button type="button" variant="ghost" size="icon-xs" aria-label="宿題登録を閉じる" onClick={() => { setOpen(false); onClose?.() }}>
          <X aria-hidden />
        </Button>
      </div>
      <form action={action} className="space-y-3">
        <PendingStatus pending={isPending} label="宿題を追加しています" />
        {state.error && <FormMessage type="error">{state.error} 入力内容を確認してください。</FormMessage>}
        <FormProgress />
        <div className="space-y-2">
          <FormField htmlFor={`${fieldPrefix}-homework-student`} label="生徒" required>
            {students.length === 1 ? (
              <>
                <input type="hidden" name="studentId" value={students[0].id} />
                <Input id={`${fieldPrefix}-homework-student`} value={`${students[0].user.name}（${students[0].grade}）`} disabled />
              </>
            ) : (
              <Select
                id={`${fieldPrefix}-homework-student`}
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
          </FormField>
          <FormField htmlFor={`${fieldPrefix}-homework-title`} label="タイトル" required example="数学 p.30〜35">
            <Input id={`${fieldPrefix}-homework-title`} name="title" placeholder="数学 p.30〜35" required className="md:h-9" />
          </FormField>
          <FormField htmlFor={`${fieldPrefix}-homework-date`} label="期限" required>
            <Input id={`${fieldPrefix}-homework-date`} name="dueDate" type="date" required defaultValue={defaultDate} className="md:h-9" />
          </FormField>
        </div>
        <div className="flex items-center justify-end gap-1.5 border-t border-border/60 pt-3">
          <Button type="button" variant="ghost" size="sm" onClick={() => { setOpen(false); onClose?.() }}>
            キャンセル
          </Button>
          <Button type="submit" size="sm" disabled={isPending}>
            <Plus aria-hidden />
            {isPending ? "追加中..." : "追加"}
          </Button>
        </div>
      </form>
    </section>
  )
}

export function ExamEventForm({ students, defaultDate, embedded = false, onClose }: { students: Student[]; defaultDate: string; embedded?: boolean; onClose?: () => void }) {
  const fieldPrefix = useId().replaceAll(":", "")
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
    <div className="apple-card-surface rounded-2xl p-3 space-y-3 w-full">
      <h3 className="font-medium text-sm">テストを追加</h3>
      <form action={action} className="space-y-3">
        <PendingStatus pending={isPending} label="テストを追加しています" />
        {state.error && (
          <FormMessage type="error">{state.error} 入力内容を確認してください。</FormMessage>
        )}
        <FormProgress />
        <div className="space-y-2">
          <FormField htmlFor={`${fieldPrefix}-exam-student`} label="生徒" required>
            {students.length === 1 ? (
              <>
                <input type="hidden" name="studentId" value={students[0].id} />
                <Input id={`${fieldPrefix}-exam-student`} value={`${students[0].user.name}（${students[0].grade}）`} disabled />
              </>
            ) : (
              <Select
                id={`${fieldPrefix}-exam-student`}
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
          </FormField>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <FormField htmlFor={`${fieldPrefix}-exam-start`} label="開始日" required>
              <Input id={`${fieldPrefix}-exam-start`} name="date" type="date" required defaultValue={defaultDate} className="md:h-9" />
            </FormField>
            <FormField htmlFor={`${fieldPrefix}-exam-end`} label="終了日">
              <Input id={`${fieldPrefix}-exam-end`} name="endDate" type="date" className="md:h-9" />
            </FormField>
          </div>
          <FormField htmlFor={`${fieldPrefix}-exam-name`} label="テスト名" required example="英語期末テスト">
            <Input id={`${fieldPrefix}-exam-name`} name="name" placeholder="英語期末テスト" required className="md:h-9" />
          </FormField>
          <FormField htmlFor={`${fieldPrefix}-exam-type`} label="種別" required>
            <Select
              id={`${fieldPrefix}-exam-type`}
              name="testType"
              defaultValue="exam"
              required
              className="md:h-9"
            >
              {TEST_TYPE_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
          </FormField>
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={isPending}>
            <Plus aria-hidden />
            {isPending ? "追加中..." : "追加"}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => { setOpen(false); onClose?.() }}>
            <X aria-hidden />
            キャンセル
          </Button>
        </div>
      </form>
    </div>
  )
}
