"use client"

import { useState } from "react"

type Props = {
  date: string
  subjectNames: string[]
  log: string
}

export function LessonLogCard({ date, subjectNames, log }: Props) {
  const [expanded, setExpanded] = useState(false)
  const needsClamp = log.length > 120 || log.split("\n").length > 3

  return (
    <div className="rounded-lg border bg-card p-3 space-y-1.5">
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-xs text-muted-foreground">{date}</p>
        {subjectNames.map((n) => (
          <span key={n} className="text-xs bg-muted text-foreground rounded-full px-2 py-0.5">{n}</span>
        ))}
      </div>
      <p className={`text-sm text-foreground whitespace-pre-wrap leading-relaxed ${!expanded && needsClamp ? "line-clamp-3" : ""}`}>
        {log}
      </p>
      {needsClamp && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-xs text-primary hover:underline"
        >
          {expanded ? "閉じる" : "続きを見る"}
        </button>
      )}
    </div>
  )
}
