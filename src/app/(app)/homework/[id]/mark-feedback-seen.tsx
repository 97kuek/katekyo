"use client"

import { useEffect } from "react"
import { markFeedbackSeen } from "./actions"

/** 生徒が宿題詳細を開いたときに、未読フィードバックを既読化する */
export function MarkFeedbackSeen({ homeworkId }: { homeworkId: string }) {
  useEffect(() => {
    markFeedbackSeen(homeworkId)
  }, [homeworkId])

  return null
}
