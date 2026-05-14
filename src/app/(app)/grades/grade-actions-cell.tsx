"use client"

import Link from "next/link"
import { deleteGradeRecord } from "./[id]/edit-actions"

export function GradeActionsCell({ gradeId }: { gradeId: string }) {
  return (
    <div className="flex items-center justify-end gap-3">
      <Link href={`/grades/${gradeId}/edit`} className="text-xs text-blue-600 hover:underline">
        編集
      </Link>
      <form
        action={deleteGradeRecord}
        onSubmit={(e) => {
          if (!confirm("この成績記録を削除しますか？")) e.preventDefault()
        }}
      >
        <input type="hidden" name="gradeId" value={gradeId} />
        <button type="submit" className="text-xs text-red-500 hover:text-red-700 hover:underline">
          削除
        </button>
      </form>
    </div>
  )
}
