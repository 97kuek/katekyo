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
      <div className="flex gap-2 flex-wrap">
        <Input name="name" required placeholder="教材名（例: チャート式数学）" className="flex-1 min-w-[200px]" />
        <Input name="note" placeholder="メモ（任意）" className="flex-1 min-w-[160px]" />
      </div>
      {subjects.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">科目タグ（任意・複数選択可）</p>
          <div className="flex flex-wrap gap-2">
            {subjects.map((s) => (
              <label key={s.id} className="inline-flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" name="subjectIds" value={s.id} className="accent-primary" />
                <span className="text-xs">{s.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}
      <Button type="submit" disabled={isPending} size="sm">
        {isPending ? "追加中..." : "追加"}
      </Button>
      {state.error && <p className="text-xs text-destructive">{state.error}</p>}
    </form>
  )
}
