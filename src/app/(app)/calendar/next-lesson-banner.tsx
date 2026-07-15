"use client"

import { buttonVariants } from "@/components/ui/button"
import type { Lesson } from "./calendar-types"
import { CalendarDays } from "lucide-react"

export function NextLessonBanner({ lessons, isTeacher }: { lessons: Lesson[]; isTeacher: boolean }) {
  const now = new Date()
  const next = lessons.find((l) => l.date > now)
  if (!next) return null

  // カレンダー日付の差（時刻を除く）で計算することで正確な「明日/明後日」を表示
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const lessonMidnight = new Date(next.date.getFullYear(), next.date.getMonth(), next.date.getDate())
  const diffDays = Math.round((lessonMidnight.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24))
  const when = diffDays === 0 ? "今日" : diffDays === 1 ? "明日" : diffDays === 2 ? "明後日" : `${diffDays}日後`

  return (
    <div className="rounded-lg bg-muted border px-4 py-3 flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-foreground">
        <CalendarDays className="h-4 w-4" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">
          次の授業: <span className="text-primary">{when}</span>
          {" — "}
          {next.date.toLocaleDateString("ja-JP", { month: "short", day: "numeric", weekday: "short" })}{" "}
          {next.date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {isTeacher ? `${next.student.user.name} · ` : ""}
          {next.type === "online" ? "オンライン" : "対面"}
          {next.durationMin ? ` · ${next.durationMin}分` : ""}
        </p>
      </div>
      {next.type === "online" && next.meetLink && (
        <a
          href={next.meetLink}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ size: "sm" }) + " shrink-0"}
        >
          参加する
        </a>
      )}
    </div>
  )
}
