"use client"

import { useActionState } from "react"
import { createMaterial } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Subject = { id: string; name: string }

export function AddMaterialForm({ studentId, subjects }: { studentId: string; subjects: Subject[] }) {
  const [state, action, isPending] = useActionState(createMaterial, { error: "" })

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="studentId" value={studentId} />
      <div className="grid gap-2 sm:grid-cols-2">
        <Input name="name" required placeholder="教材名（例: チャート式数学）" />
        <Input name="note" placeholder="メモ（任意）" />
      </div>
      {subjects.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">科目タグ（任意・複数選択可）</p>
          <div className="flex flex-wrap gap-2">
            {subjects.map((s) => (
              <label key={s.id} className="inline-flex min-h-11 items-center gap-1.5 cursor-pointer">
                <input type="checkbox" name="subjectIds" value={s.id} className="accent-primary" />
                <span className="text-xs">{s.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}
      <Button type="submit" disabled={isPending} size="sm" className="h-10 sm:h-8">
        {isPending ? "追加中..." : "追加"}
      </Button>
      {state.error && <p className="text-xs text-destructive">{state.error}</p>}
    </form>
  )
}
