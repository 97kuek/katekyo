"use client"

import { buttonVariants } from "@/components/ui/button"
import type { Lesson } from "./calendar-types"
import { CalendarDays } from "lucide-react"

export function NextLessonBanner({ lessons, isTeacher, showStudentNames = false }: { lessons: Lesson[]; isTeacher: boolean; showStudentNames?: boolean }) {
  const now = new Date()
  const next = lessons.find((l) => l.date > now)
  if (!next) return null

  // 「明日/明後日」は表示と同じ JST のカレンダー日付で数える（端末が海外時間でもズレない）
  const jstDateMs = (d: Date) =>
    new Date(d.toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" }) + "T00:00:00Z").getTime()
  const diffDays = Math.round((jstDateMs(next.date) - jstDateMs(now)) / (1000 * 60 * 60 * 24))
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
          {next.date.toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo", month: "numeric", day: "numeric", weekday: "short" })}{" "}
          {next.date.toLocaleTimeString("ja-JP", { timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit" })}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {isTeacher || showStudentNames ? `${next.student.user.name} · ` : ""}
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
