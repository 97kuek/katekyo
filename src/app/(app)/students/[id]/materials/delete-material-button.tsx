"use client"

import { useTransition } from "react"
import { deleteMaterial } from "./actions"

export function DeleteMaterialButton({ materialId, studentId }: { materialId: string; studentId: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await deleteMaterial(materialId, studentId)
        })
      }
      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
    >
      {isPending ? "削除中..." : "削除"}
    </button>
  )
}
