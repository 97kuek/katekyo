"use client"

import {
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  ChevronRight,
  FileText,
  UserRound,
} from "lucide-react"
import { useState } from "react"
import { ActionLink, ActionList } from "@/components/ui/action-list"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type StudentSplitItem = {
  id: string
  name: string
  email: string
  grade: string
  reviewCount: number
  problemCount: number
  nextLesson: string | null
}

function signalLabel(student: StudentSplitItem) {
  if (student.reviewCount > 0) return `確認待ち ${student.reviewCount}件`
  if (student.problemCount > 0) return `要対応 ${student.problemCount}件`
  if (student.nextLesson) {
    return `次回 ${new Intl.DateTimeFormat("ja-JP", {
      timeZone: "Asia/Tokyo",
      month: "numeric",
      day: "numeric",
    }).format(new Date(student.nextLesson))}`
  }
  return "要対応なし"
}

export function StudentSplitView({ students }: { students: StudentSplitItem[] }) {
  const [selectedId, setSelectedId] = useState(students[0]?.id)
  const selected = students.find((student) => student.id === selectedId) ?? students[0]

  if (!selected) return null

  const nextLesson = selected.nextLesson
    ? new Intl.DateTimeFormat("ja-JP", {
        timeZone: "Asia/Tokyo",
        month: "long",
        day: "numeric",
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(selected.nextLesson))
    : "予定なし"

  return (
    <div className="hidden min-h-[32rem] grid-cols-[minmax(17rem,0.85fr)_minmax(22rem,1.15fr)] gap-4 md:grid">
      <nav aria-label="生徒一覧" className="apple-card-surface h-fit overflow-hidden rounded-2xl p-2">
        <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {students.length}名
        </p>
        <div className="space-y-1">
          {students.map((student) => {
            const active = student.id === selected.id
            return (
              <Button
                key={student.id}
                type="button"
                variant="ghost"
                aria-pressed={active}
                onClick={() => setSelectedId(student.id)}
                className={cn(
                  "h-auto min-h-16 w-full justify-start gap-3 rounded-xl px-3 py-2.5 text-left font-normal",
                  active && "bg-primary/10 text-foreground hover:bg-primary/10"
                )}
              >
                <span className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold",
                  active && "bg-primary text-primary-foreground"
                )}>
                  {student.name.slice(0, 1)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className="truncate text-sm font-semibold">{student.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{student.grade}</span>
                  </span>
                  <span className={cn(
                    "mt-0.5 block truncate text-xs",
                    student.problemCount > 0 ? "text-destructive" : student.reviewCount > 0 ? "text-primary" : "text-muted-foreground"
                  )}>
                    {signalLabel(student)}
                  </span>
                </span>
                <ChevronRight className={cn("size-4 shrink-0 text-muted-foreground transition-transform", active && "translate-x-0.5")} aria-hidden />
              </Button>
            )
          })}
        </div>
      </nav>

      <aside aria-live="polite" aria-label={`${selected.name}の概要`} className="apple-card-surface h-fit overflow-hidden rounded-2xl">
        <div className="border-b border-border/60 p-5">
          <div className="flex items-center gap-4">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
              {selected.name.slice(0, 1)}
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-xl font-bold tracking-tight">{selected.name}</h2>
              <p className="truncate text-sm text-muted-foreground">{selected.grade}・{selected.email}</p>
            </div>
          </div>

          <dl className="mt-5 grid grid-cols-3 divide-x overflow-hidden rounded-xl bg-muted/65 text-center">
            <div className="px-2 py-3">
              <dt className="text-xs text-muted-foreground">確認待ち</dt>
              <dd className="mt-0.5 text-lg font-bold tabular-nums">{selected.reviewCount}</dd>
            </div>
            <div className="px-2 py-3">
              <dt className="text-xs text-muted-foreground">要対応</dt>
              <dd className={cn("mt-0.5 text-lg font-bold tabular-nums", selected.problemCount > 0 && "text-destructive")}>{selected.problemCount}</dd>
            </div>
            <div className="px-2 py-3">
              <dt className="text-xs text-muted-foreground">次回授業</dt>
              <dd className="mt-1 truncate text-xs font-semibold">{nextLesson}</dd>
            </div>
          </dl>
        </div>

        <div className="p-4">
          <ActionList className="shadow-none">
            <ActionLink href={`/students/${selected.id}`} icon={<UserRound />} label="生徒プロフィール" description="連絡先と学習状況をまとめて確認" />
            <ActionLink href={`/homework?studentId=${selected.id}`} icon={<BookOpenCheck />} label="宿題" description="提出状況と期限を確認" />
            <ActionLink href={`/calendar?studentId=${selected.id}`} icon={<CalendarDays />} label="予定" description="授業予定を確認・調整" />
            <ActionLink href={`/grades?studentId=${selected.id}`} icon={<BarChart3 />} label="成績" description="推移とテスト結果を確認" />
            <ActionLink href={`/students/${selected.id}/materials`} icon={<FileText />} label="教材" description="使用教材を確認" />
          </ActionList>
        </div>
      </aside>
    </div>
  )
}
