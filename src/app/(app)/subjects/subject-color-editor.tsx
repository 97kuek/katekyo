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
    <div className="relative flex min-w-0 items-center gap-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="グラフの色を変更"
        aria-expanded={open}
        className="flex size-11 shrink-0 items-center justify-center rounded-full transition-transform active:scale-90 motion-reduce:transform-none motion-reduce:transition-none"
      >
        <span className="size-4 rounded-full border border-border/60" style={{ backgroundColor: color ?? "var(--muted)" }} />
      </button>
      <span className={`text-sm font-medium truncate ${isPending ? "opacity-50" : ""}`}>{name}</span>
      {open && (
        <div className="absolute left-0 top-11 z-10 rounded-lg border bg-popover p-2 text-popover-foreground shadow-md">
          <SwatchPicker value={color ?? ""} onChange={handlePick} />
        </div>
      )}
    </div>
  )
}
