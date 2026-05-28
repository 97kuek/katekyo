"use client"

import { useEffect, useRef, useState } from "react"
import { Bell, BookOpen, Calendar, X } from "lucide-react"
import Link from "next/link"
import { CHANGELOG, LATEST_CHANGELOG_ID, type NotificationData } from "@/lib/changelog"

const STORAGE_KEY = "lastSeenChangelogId"

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  })
}

export default function ChangelogBell({ notificationData }: { notificationData: NotificationData }) {
  const [hasUnread, setHasUnread] = useState(false)
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setHasUnread(localStorage.getItem(STORAGE_KEY) !== LATEST_CHANGELOG_ID)
  }, [])

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) handleClose()
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  function handleOpen() {
    setOpen(true)
    setHasUnread(false)
    localStorage.setItem(STORAGE_KEY, LATEST_CHANGELOG_ID)
  }

  function handleClose() {
    setOpen(false)
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="relative inline-flex items-center justify-center rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-label="通知"
      >
        <Bell className="h-4 w-4" />
        {hasUnread && (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/30">
          <div
            ref={panelRef}
            className="absolute right-0 top-0 h-full w-full max-w-sm bg-background shadow-xl flex flex-col border-l border-border"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4 shrink-0">
              <h2 className="font-semibold text-sm">通知</h2>
              <button
                onClick={handleClose}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="閉じる"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Today's summary */}
              <div className="px-5 py-4 space-y-4">
                {notificationData.role === "teacher" ? (
                  <>
                    <Section icon={<BookOpen className="h-3.5 w-3.5 text-muted-foreground" />} label="提出待ちの宿題">
                      {notificationData.pendingHomework.length === 0 ? (
                        <Empty>提出待ちはありません</Empty>
                      ) : (
                        notificationData.pendingHomework.map((h) => (
                          <li key={h.id}>
                            <Link
                              href={`/homework/${h.id}/review`}
                              className="text-sm text-foreground hover:text-primary hover:underline"
                              onClick={handleClose}
                            >
                              <span className="text-xs text-muted-foreground mr-1">{h.studentName}</span>
                              {h.title}
                            </Link>
                          </li>
                        ))
                      )}
                    </Section>

                    <Section icon={<Calendar className="h-3.5 w-3.5 text-muted-foreground" />} label="今日の授業">
                      {notificationData.lessons.length === 0 ? (
                        <Empty>今日の授業はありません</Empty>
                      ) : (
                        notificationData.lessons.map((l) => (
                          <li key={l.id} className="flex items-center gap-2 text-sm text-foreground">
                            <span className="text-xs text-muted-foreground shrink-0">{formatTime(l.date)}</span>
                            {l.studentName}
                            <span className="text-xs text-muted-foreground">（{l.type === "online" ? "オンライン" : "対面"}）</span>
                          </li>
                        ))
                      )}
                    </Section>
                  </>
                ) : (
                  <>
                    <Section icon={<BookOpen className="h-3.5 w-3.5 text-muted-foreground" />} label="今日の宿題">
                      {notificationData.homework.length === 0 ? (
                        <Empty>本日の宿題はありません</Empty>
                      ) : (
                        notificationData.homework.map((h) => (
                          <li key={h.id} className="flex items-center gap-2">
                            <Link
                              href={`/homework/${h.id}/submit`}
                              className="text-sm text-foreground hover:text-primary hover:underline"
                              onClick={handleClose}
                            >
                              {h.title}
                            </Link>
                            {h.isOverdue && (
                              <span className="text-xs text-destructive shrink-0">期限切れ</span>
                            )}
                          </li>
                        ))
                      )}
                    </Section>

                    <Section icon={<Calendar className="h-3.5 w-3.5 text-muted-foreground" />} label="今日の授業">
                      {notificationData.lessons.length === 0 ? (
                        <Empty>今日の授業はありません</Empty>
                      ) : (
                        notificationData.lessons.map((l) => (
                          <li key={l.id} className="flex items-center gap-2 text-sm text-foreground">
                            <span className="text-xs text-muted-foreground shrink-0">{formatTime(l.date)}</span>
                            {l.type === "online" ? "オンライン" : "対面"}
                          </li>
                        ))
                      )}
                    </Section>
                  </>
                )}
              </div>

              <div className="border-t border-border mx-5" />

              {/* Changelog */}
              <div className="px-5 py-4 space-y-6">
                <p className="text-xs font-medium text-muted-foreground">アップデート情報</p>
                {CHANGELOG.map((entry) => (
                  <div key={entry.id}>
                    <p className="text-xs text-muted-foreground mb-1">{entry.date}</p>
                    <h3 className="text-sm font-medium mb-2">{entry.title}</h3>
                    <ul className="space-y-1.5">
                      {entry.items.map((item, i) => (
                        <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function Section({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <ul className="space-y-1.5 pl-5">{children}</ul>
    </div>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-muted-foreground">{children}</p>
}
