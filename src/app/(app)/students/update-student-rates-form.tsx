"use client"

import { useActionState, useState } from "react"
import { updateStudentRates } from "./actions"

type Props = {
  studentId: string
  defaultHourlyRate: number | null
  defaultTravelExpense: number | null
}

export function UpdateStudentRatesForm({ studentId, defaultHourlyRate, defaultTravelExpense }: Props) {
  const [open, setOpen] = useState(false)
  const [state, action, isPending] = useActionState(updateStudentRates, { error: "", success: false })

  const summary =
    defaultHourlyRate != null || defaultTravelExpense != null
      ? [
          defaultHourlyRate != null ? `¥${defaultHourlyRate.toLocaleString()}/h` : null,
          defaultTravelExpense != null ? `交通費¥${defaultTravelExpense.toLocaleString()}` : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : null

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-gray-400 hover:text-gray-600 hover:underline"
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
      {state.error && <p className="w-full text-xs text-red-600">{state.error}</p>}
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
      <button type="submit" disabled={isPending} className="text-xs text-primary hover:underline disabled:opacity-50">
        保存
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-xs text-gray-400 hover:underline">
        キャンセル
      </button>
    </form>
  )
}
