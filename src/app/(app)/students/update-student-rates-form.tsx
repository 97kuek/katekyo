"use client"

import { useActionState, useState } from "react"
import { updateStudentRates } from "./actions"

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
  const [state, action, isPending] = useActionState(updateStudentRates, { error: "", success: false })

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
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-muted-foreground hover:text-foreground hover:underline"
      >
        {summary ?? "時給・交通費を設定"}
      </button>
    )
  }

  return (
    <form
      action={async (fd) => {
        await action(fd)
        setOpen(false)
      }}
      className="flex flex-wrap items-center gap-1.5"
    >
      <input type="hidden" name="studentId" value={studentId} />
      {state.error && <p className="w-full text-xs text-destructive">{state.error}</p>}
      <input
        name="defaultHourlyRate"
        type="number"
        min="0"
        placeholder="時給（円）"
        defaultValue={defaultHourlyRate ?? ""}
        className="h-7 w-24 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <input
        name="defaultTravelExpense"
        type="number"
        min="0"
        placeholder="交通費（円）"
        defaultValue={defaultTravelExpense ?? ""}
        className="h-7 w-24 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <input
        name="defaultDurationHours"
        type="number"
        min="0.5"
        step="0.5"
        placeholder="授業時間（h）"
        defaultValue={defaultDurationMin != null ? defaultDurationMin / 60 : ""}
        className="h-7 w-28 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
      />
      {subjects.length > 0 && (
        <div className="w-full flex flex-wrap gap-x-3 gap-y-1">
          {subjects.map((s) => (
            <label key={s.id} className="flex items-center gap-1 text-xs cursor-pointer">
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
      <button type="submit" disabled={isPending} className="text-xs text-primary hover:underline disabled:opacity-50">
        保存
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-xs text-muted-foreground hover:underline">
        キャンセル
      </button>
    </form>
  )
}
