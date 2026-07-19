"use client"

import { useActionState, useState } from "react"
import { updateStudentRates } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { PendingStatus } from "@/components/ui/pending-status"
import { ChoiceControl } from "@/components/ui/choice-control"
import { Pencil, Save, X } from "lucide-react"
import { FormField, FormFieldLabel } from "@/components/ui/form-field"
import { FormMessage } from "@/components/ui/form-message"

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
      <div className="flex min-w-0 max-w-full items-center justify-between gap-2">
        <span className="min-w-0 truncate text-xs text-muted-foreground">{summary ?? "未設定"}</span>
        <Button type="button" variant="outline" size="xs" onClick={() => setOpen(true)}>
          <Pencil aria-hidden />
          編集
        </Button>
      </div>
    )
  }

  return (
    <form action={action} className="grid gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-1.5">
      <PendingStatus pending={isPending} label="授業条件を保存しています" />
      <input type="hidden" name="studentId" value={studentId} />
      {state.error && <FormMessage type="error">{state.error}</FormMessage>}
      <p className="w-full text-xs text-muted-foreground">すべて任意です。半角数字で入力し、カンマ・単位・ハイフンは付けません。</p>
      <FormField htmlFor={`rate-${studentId}`} label="時給（円）" className="sm:w-28">
        <Input id={`rate-${studentId}`} name="defaultHourlyRate" type="number" inputMode="numeric" min="0" placeholder="3000" defaultValue={defaultHourlyRate ?? ""} className="sm:h-8 sm:text-xs" />
      </FormField>
      <FormField htmlFor={`travel-${studentId}`} label="交通費（円）" className="sm:w-28">
        <Input id={`travel-${studentId}`} name="defaultTravelExpense" type="number" inputMode="numeric" min="0" placeholder="500" defaultValue={defaultTravelExpense ?? ""} className="sm:h-8 sm:text-xs" />
      </FormField>
      <FormField htmlFor={`duration-${studentId}`} label="授業時間（時間）" className="sm:w-32">
        <Input id={`duration-${studentId}`} name="defaultDurationHours" type="number" inputMode="decimal" min="0.5" step="0.5" placeholder="1.5" defaultValue={defaultDurationMin != null ? defaultDurationMin / 60 : ""} className="sm:h-8 sm:text-xs" />
      </FormField>
      {subjects.length > 0 && (
        <div className="w-full space-y-2">
          <FormFieldLabel label="科目（複数選択可）" />
          <div className="flex flex-wrap gap-2">
          {subjects.map((s) => (
            <ChoiceControl key={s.id} type="checkbox" name="defaultSubjectIds" value={s.id} defaultChecked={defaultSubjectIds.includes(s.id)} label={s.name} />
          ))}
          </div>
        </div>
      )}
      <Button type="submit" disabled={isPending} size="sm" className="h-10 sm:h-8">
        <Save aria-hidden />
        保存
      </Button>
      <Button type="button" variant="outline" size="sm" className="h-10 sm:h-8" onClick={() => setOpen(false)}>
        <X aria-hidden />
        キャンセル
      </Button>
    </form>
  )
}
