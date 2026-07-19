"use client"

import { useEffect, useRef, useState } from "react"
import { CheckCircle2 } from "lucide-react"

type Progress = { completed: number; total: number }

function requiredFieldProgress(form: HTMLFormElement): Progress {
  const controls = Array.from(form.elements).filter((element): element is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement =>
    (element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement)
      && element.required
      && !element.disabled
      && element.type !== "hidden"
  )
  const groups = new Map<string, typeof controls>()
  for (const control of controls) {
    const key = control.name || control.id
    groups.set(key, [...(groups.get(key) ?? []), control])
  }
  const completed = Array.from(groups.values()).filter((group) => {
    const first = group[0]
    if (first instanceof HTMLInputElement && (first.type === "radio" || first.type === "checkbox")) {
      return group.some((control) => control instanceof HTMLInputElement && control.checked)
    }
    return first.value.trim().length > 0 && first.validity.valid
  }).length
  return { completed, total: groups.size }
}

export function FormProgress() {
  const ref = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState<Progress>({ completed: 0, total: 0 })

  useEffect(() => {
    const form = ref.current?.closest("form")
    if (!form) return
    const update = () => setProgress(requiredFieldProgress(form))
    const frame = window.requestAnimationFrame(update)
    form.addEventListener("input", update)
    form.addEventListener("change", update)
    return () => {
      window.cancelAnimationFrame(frame)
      form.removeEventListener("input", update)
      form.removeEventListener("change", update)
    }
  }, [])

  if (progress.total === 0) return <div ref={ref} className="min-h-[4.25rem]" aria-hidden />
  const percentage = Math.round((progress.completed / progress.total) * 100)
  const complete = progress.completed === progress.total

  return (
    <div ref={ref} className="rounded-lg border bg-muted/60 p-3" aria-live="polite">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="flex items-center gap-1.5 font-medium text-foreground">
          {complete && <CheckCircle2 className="size-3.5 text-primary" aria-hidden />}
          {complete ? "必須項目の入力が完了しました" : `必須項目 ${progress.completed}/${progress.total}`}
        </span>
        <span className="tabular-nums text-muted-foreground">{percentage}%</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background" aria-hidden>
        <div className="h-full rounded-full bg-primary transition-[width] motion-reduce:transition-none" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  )
}
