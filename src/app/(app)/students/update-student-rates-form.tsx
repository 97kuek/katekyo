"use client"

import { useActionState, useState } from "react"
import { updateStudentRates } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { PendingStatus } from "@/components/ui/pending-status"

type Props = {
  studentId: string
  defaultHourlyRate: number | null
  defaultTravelExpense: number | null
  defaultDurationMin: number | null
  defaultSubjectIds: string[]
  subjects: { id: string; name: string }[]
}

export function UpdateStudentRatesForm({ studentId, defaultHourlyRate, defaultTravelExpense, defaultDurationMin, defaultSubjectIds, subjects }: Props) {
  const [open, setOpen] = useState(false)
  const [state, action, isPending] = useActionState(
    async (previous: { error: string; success: boolean }, formData: FormData) => {
      const result = await updateStudentRates(previous, formData)
      if (result.success) {
        setOpen(false)
        toast.success("授業条件を保存しました。次回の予定作成時に自動入力されます")
      }
      return result
    },
    { error: "", success: false }
  )

  const summary =
    defaultHourlyRate != null || defaultTravelExpense != null || defaultDurationMin != null
      ? [
          defaultHourlyRate != null ? `¥${defaultHourlyRate.toLocaleString()}/h` : null,
          defaultTravelExpense != null ? `交通費¥${defaultTravelExpense.toLocaleString()}` : null,
          defaultDurationMin != null ? `${defaultDurationMin / 60}h` : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : null

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        size="xs"
        onClick={() => setOpen(true)}
      >
        {summary ?? "時給・交通費を設定"}
      </Button>
    )
  }

  return (
    <form action={action} className="grid gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-1.5">
      <PendingStatus pending={isPending} label="授業条件を保存しています" />
      <input type="hidden" name="studentId" value={studentId} />
      {state.error && <p className="w-full text-xs text-destructive">{state.error}</p>}
      <p className="w-full text-xs text-muted-foreground">すべて任意です。半角数字で入力し、カンマ・単位・ハイフンは付けません。</p>
      <label className="grid gap-1 text-xs font-medium">時給（円・任意）
        <Input name="defaultHourlyRate" type="number" inputMode="numeric" min="0" placeholder="3000" defaultValue={defaultHourlyRate ?? ""} className="sm:h-7 sm:w-24 sm:text-xs" />
      </label>
      <label className="grid gap-1 text-xs font-medium">交通費（円・任意）
        <Input name="defaultTravelExpense" type="number" inputMode="numeric" min="0" placeholder="500" defaultValue={defaultTravelExpense ?? ""} className="sm:h-7 sm:w-24 sm:text-xs" />
      </label>
      <label className="grid gap-1 text-xs font-medium">授業時間（時間・任意）
        <Input name="defaultDurationHours" type="number" inputMode="decimal" min="0.5" step="0.5" placeholder="1.5" defaultValue={defaultDurationMin != null ? defaultDurationMin / 60 : ""} className="sm:h-7 sm:w-28 sm:text-xs" />
      </label>
      {subjects.length > 0 && (
        <div className="w-full flex flex-wrap gap-x-3 gap-y-1">
          {subjects.map((s) => (
            <label key={s.id} className="flex min-h-11 items-center gap-1 text-xs cursor-pointer">
              <input
                type="checkbox"
                name="defaultSubjectIds"
                value={s.id}
                defaultChecked={defaultSubjectIds.includes(s.id)}
                className="accent-primary"
              />
              {s.name}
            </label>
          ))}
        </div>
      )}
      <Button type="submit" disabled={isPending} size="sm" className="h-10 sm:h-8">
        保存
      </Button>
      <Button type="button" variant="outline" size="sm" className="h-10 sm:h-8" onClick={() => setOpen(false)}>
        キャンセル
      </Button>
    </form>
  )
}
