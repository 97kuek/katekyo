"use client"

import { BookOpen, CalendarClock, ChevronRight, Eye, Pencil, UserRound } from "lucide-react"
import { useState } from "react"
import type { HomeworkStatus } from "@/generated/prisma/enums"
import { StatusBadge } from "@/components/homework/status-badge"
import { ActionLink, ActionList } from "@/components/ui/action-list"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type HomeworkSplitItem = {
  id: string
  title: string
  description: string | null
  studentName: string
  status: HomeworkStatus
  subjectNames: string[]
  dueDateLabel: string
  relativeLabel: string | null
  canEdit: boolean
  isOverdue: boolean
}

export function HomeworkSplitView({ homeworks }: { homeworks: HomeworkSplitItem[] }) {
  const [selectedId, setSelectedId] = useState(homeworks[0]?.id)
  const selected = homeworks.find((homework) => homework.id === selectedId) ?? homeworks[0]

  if (!selected) return null

  return (
    <div className="hidden min-h-[32rem] grid-cols-[minmax(18rem,0.9fr)_minmax(22rem,1.1fr)] gap-4 md:grid">
      <nav aria-label="宿題一覧" className="apple-card-surface h-fit overflow-hidden rounded-2xl p-2">
        <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {homeworks.length}件を表示
        </p>
        <div className="space-y-1">
          {homeworks.map((homework) => {
            const active = homework.id === selected.id
            return (
              <Button
                key={homework.id}
                type="button"
                variant="ghost"
                aria-pressed={active}
                onClick={() => setSelectedId(homework.id)}
                className={cn(
                  "h-auto min-h-[4.5rem] w-full justify-start gap-3 rounded-xl px-3 py-2.5 text-left font-normal",
                  active && "bg-primary/10 text-foreground hover:bg-primary/10",
                  homework.isOverdue && !active && "bg-destructive/5"
                )}
              >
                <span className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted",
                  active && "bg-primary text-primary-foreground"
                )}>
                  <BookOpen className="size-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{homework.title}</span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {homework.studentName}・{homework.dueDateLabel}
                  </span>
                  {homework.relativeLabel && (
                    <span className={cn("mt-0.5 block text-xs", homework.isOverdue ? "font-semibold text-destructive" : "text-muted-foreground")}>
                      {homework.relativeLabel}
                    </span>
                  )}
                </span>
                <ChevronRight className={cn("size-4 shrink-0 text-muted-foreground transition-transform", active && "translate-x-0.5")} aria-hidden />
              </Button>
            )
          })}
        </div>
      </nav>

      <aside aria-live="polite" aria-label={`${selected.title}の概要`} className="apple-card-surface h-fit overflow-hidden rounded-2xl">
        <div className="border-b border-border/60 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">{selected.studentName}</p>
              <h2 className="mt-1 text-xl font-bold tracking-tight">{selected.title}</h2>
            </div>
            <StatusBadge status={selected.status} />
          </div>

          <dl className="mt-5 grid grid-cols-2 divide-x overflow-hidden rounded-xl bg-muted/65">
            <div className="px-4 py-3">
              <dt className="flex items-center gap-1.5 text-xs text-muted-foreground"><UserRound className="size-3.5" aria-hidden />生徒</dt>
              <dd className="mt-1 truncate text-sm font-semibold">{selected.studentName}</dd>
            </div>
            <div className="px-4 py-3">
              <dt className="flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarClock className="size-3.5" aria-hidden />期限</dt>
              <dd className={cn("mt-1 text-sm font-semibold", selected.isOverdue && "text-destructive")}>
                {selected.dueDateLabel}{selected.relativeLabel ? `（${selected.relativeLabel}）` : ""}
              </dd>
            </div>
          </dl>

          {selected.subjectNames.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5" aria-label="科目">
              {selected.subjectNames.map((subject) => (
                <span key={subject} className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">{subject}</span>
              ))}
            </div>
          )}

          <div className="mt-4 rounded-xl bg-muted/45 p-4">
            <p className="text-xs font-semibold text-muted-foreground">宿題の内容</p>
            <p className={cn("mt-1.5 whitespace-pre-wrap text-sm leading-relaxed", !selected.description && "text-muted-foreground")}>
              {selected.description || "詳しい説明は登録されていません。"}
            </p>
          </div>
        </div>

        <div className="p-4">
          <ActionList className="shadow-none">
            <ActionLink href={`/homework/${selected.id}`} icon={<Eye />} label="詳細を開く" description="提出内容・履歴・操作をまとめて確認" />
            {selected.canEdit && (
              <ActionLink href={`/homework/${selected.id}/edit`} icon={<Pencil />} label="宿題を編集" description="内容や期限を変更" />
            )}
          </ActionList>
        </div>
      </aside>
    </div>
  )
}
