"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import { Check } from "lucide-react"
import { createSubject } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SUBJECT_COLORS } from "@/lib/subject-colors"

export default function SubjectForm() {
  const [state, action, isPending] = useActionState(createSubject, { error: "", success: false })
  const formRef = useRef<HTMLFormElement>(null)
  const [color, setColor] = useState<string>(SUBJECT_COLORS[0])

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset()
      setColor(SUBJECT_COLORS[0])
    }
  }, [state.success])

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <input type="hidden" name="color" value={color} />
      <div className="flex gap-2 items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="name">新しい科目タグ</Label>
          {state.error && <p className="text-xs text-destructive">{state.error}</p>}
          <Input id="name" name="name" placeholder="例: 数学、英語、国語" required maxLength={50} />
        </div>
        <Button type="submit" disabled={isPending} className="shrink-0">
          {isPending ? "追加中..." : "追加"}
        </Button>
      </div>
      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground">グラフの色</p>
        <SwatchPicker value={color} onChange={setColor} />
      </div>
    </form>
  )
}

export function SwatchPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (color: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {SUBJECT_COLORS.map((c) => {
        const selected = c === value
        return (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            aria-label={`色 ${c}`}
            aria-pressed={selected}
            className={`flex h-7 w-7 items-center justify-center rounded-full transition-transform active:scale-90 ${
              selected ? "ring-2 ring-offset-2 ring-foreground/40" : ""
            }`}
            style={{ backgroundColor: c }}
          >
            {selected && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
          </button>
        )
      })}
    </div>
  )
}
