"use client"

import { useActionState } from "react"
import { createMaterial } from "./actions"

export function AddMaterialForm({ studentId }: { studentId: string }) {
  const [state, action, isPending] = useActionState(createMaterial, { error: "" })

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="studentId" value={studentId} />
      <div className="flex gap-2 flex-wrap">
        <input
          name="name"
          required
          placeholder="教材名（例: チャート式数学）"
          className="flex-1 min-w-[200px] h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <input
          name="note"
          placeholder="メモ（任意）"
          className="flex-1 min-w-[160px] h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          type="submit"
          disabled={isPending}
          className="h-9 rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 shrink-0"
        >
          {isPending ? "追加中..." : "追加"}
        </button>
      </div>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
    </form>
  )
}
