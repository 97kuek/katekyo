"use client"

import { cancelSubmission } from "./[id]/cancel-actions"

export function CancelSubmissionButton({ homeworkId }: { homeworkId: string }) {
  return (
    <form
      action={cancelSubmission}
      onSubmit={(e) => {
        if (!confirm("提出を取り消しますか？やり直しが必要な場合は取り消してください。")) {
          e.preventDefault()
        }
      }}
    >
      <input type="hidden" name="homeworkId" value={homeworkId} />
      <button
        type="submit"
        className="text-xs text-muted-foreground hover:text-red-600 underline underline-offset-2 transition-colors"
      >
        提出を取り消す
      </button>
    </form>
  )
}
