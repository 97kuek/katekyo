"use client"

import { deleteStudent } from "./actions"

export function DeleteStudentButton({ studentId, studentName }: { studentId: string; studentName: string }) {
  return (
    <form
      action={deleteStudent}
      onSubmit={(e) => {
        if (!confirm(`${studentName} を削除しますか？\n宿題・成績のデータもすべて削除されます。`)) {
          e.preventDefault()
        }
      }}
    >
      <input type="hidden" name="studentId" value={studentId} />
      <button
        type="submit"
        className="text-xs text-red-500 hover:text-red-700 hover:underline"
      >
        削除
      </button>
    </form>
  )
}
