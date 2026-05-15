"use client"

import { useTransition, useState } from "react"
import { deleteStudent } from "./actions"

export function DeleteStudentButton({ studentId, studentName }: { studentId: string; studentName: string }) {
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-600">宿題・成績も削除されます</span>
        <button
          onClick={() => startTransition(async () => {
            const fd = new FormData()
            fd.append("studentId", studentId)
            await deleteStudent(fd)
          })}
          disabled={isPending}
          className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
        >
          {isPending ? "削除中..." : `${studentName}を削除`}
        </button>
        <button onClick={() => setConfirming(false)} className="text-xs text-gray-400 hover:text-gray-600">
          キャンセル
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs text-red-500 hover:text-red-700 hover:underline"
    >
      削除
    </button>
  )
}
