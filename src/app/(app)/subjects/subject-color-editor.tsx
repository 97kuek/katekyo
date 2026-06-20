"use client"

import { useState, useTransition } from "react"
import { updateSubjectColor } from "./actions"
import { SwatchPicker } from "./subject-form"

export function SubjectColorEditor({
  id,
  name,
  color,
}: {
  id: string
  name: string
  color: string | null
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handlePick(next: string) {
    setOpen(false)
    const fd = new FormData()
    fd.append("id", id)
    fd.append("color", next)
    startTransition(() => updateSubjectColor(fd))
  }

  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="グラフの色を変更"
        className="h-4 w-4 shrink-0 rounded-full border border-border/60 transition-transform active:scale-90"
        style={{ backgroundColor: color ?? "var(--muted)" }}
      />
      <span className={`text-sm font-medium truncate ${isPending ? "opacity-50" : ""}`}>{name}</span>
      {open && (
        <div className="absolute z-10 mt-8 rounded-lg border bg-card p-2 shadow-md">
          <SwatchPicker value={color ?? ""} onChange={handlePick} />
        </div>
      )}
    </div>
  )
}
