"use client"

import { useState } from "react"
import { UnreadBadge } from "@/components/ui/unread-badge"
import { markLessonLogSeen } from "./actions"
import { Button } from "@/components/ui/button"

type Props = {
  date: string
  subjectNames: string[]
  log: string
  lessonId?: string
  unread?: boolean
}

export function LessonLogCard({ date, subjectNames, log, lessonId, unread }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [seen, setSeen] = useState(false)
  const needsClamp = log.length > 120 || log.split("\n").length > 3

  const isUnread = !!unread && !seen

  function acknowledge() {
    if (isUnread && lessonId) {
      setSeen(true)
      markLessonLogSeen(lessonId)
    }
  }

  return (
    <div className={`rounded-lg border p-3 space-y-1.5 ${isUnread ? "border-primary/30 bg-primary/5" : "bg-card"}`}>
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-xs text-muted-foreground">{date}</p>
        {subjectNames.map((n) => (
          <span key={n} className="text-xs bg-muted text-foreground rounded-full px-2 py-0.5">{n}</span>
        ))}
        {isUnread && (
          <span className="ml-auto flex items-center gap-1.5">
            <UnreadBadge />
            <Button type="button" variant="outline" size="xs" onClick={acknowledge}>既読にする</Button>
          </span>
        )}
      </div>
      <p className={`text-sm text-foreground whitespace-pre-wrap leading-relaxed ${!expanded && needsClamp ? "line-clamp-3" : ""}`}>
        {log}
      </p>
      {needsClamp && (
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={() => { setExpanded((v) => !v); acknowledge() }}
          className="px-0 text-primary hover:bg-transparent hover:underline"
        >
          {expanded ? "閉じる" : "続きを見る"}
        </Button>
      )}
    </div>
  )
}
