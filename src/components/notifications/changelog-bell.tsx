"use client"

import { useEffect, useRef, useState } from "react"
import { Bell, BookOpen, Calendar, X } from "lucide-react"
import Link from "next/link"
import { CHANGELOG, LATEST_CHANGELOG_ID, type NotificationData } from "@/lib/changelog"
import { Button } from "@/components/ui/button"

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
  // mounted は DOM の有無、visible は enter/exit トランジションの状態。
  // 退出アニメーションを見せるため、閉じる時は visible → (遅延) → mounted の順に落とす
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const bellRef = useRef<HTMLButtonElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const closeTimer = useRef(0)
  const actionCount = notificationData.role === "teacher"
    ? notificationData.pendingHomework.length
    : notificationData.homework.length

  // localStorage（クライアント専用ストア）をハイドレーション後に読む必要があるため effect で行う
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasUnread(localStorage.getItem(STORAGE_KEY) !== LATEST_CHANGELOG_ID)
  }, [])

  // マウント直後の1フレーム後に visible にして enter トランジションを発火させ、
  // フォーカスをパネル内（閉じるボタン）へ移す
  useEffect(() => {
    if (!mounted) return
    const raf = requestAnimationFrame(() => setVisible(true))
    closeButtonRef.current?.focus()
    return () => cancelAnimationFrame(raf)
  }, [mounted])

  useEffect(() => {
    if (!mounted) return
    function handlePointerDown(e: PointerEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) handleClose()
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose()
    }
    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [mounted])

  useEffect(() => () => window.clearTimeout(closeTimer.current), [])

  function handleOpen() {
    window.clearTimeout(closeTimer.current)
    setMounted(true)
    setHasUnread(false)
    localStorage.setItem(STORAGE_KEY, LATEST_CHANGELOG_ID)
  }

  function handleClose() {
    setVisible(false)
    window.clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => setMounted(false), 250)
    bellRef.current?.focus()
  }

  return (
    <>
      <Button
        ref={bellRef}
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={handleOpen}
        className="relative text-muted-foreground"
        aria-label={actionCount > 0 ? `通知、要対応${actionCount}件` : "通知とアップデート情報"}
        aria-expanded={mounted}
      >
        <Bell className="h-4 w-4" />
        {(hasUnread || actionCount > 0) && (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive"><span className="sr-only">新着あり</span></span>
        )}
      </Button>

      {mounted && (
        <div
          className={`fixed inset-0 z-50 bg-foreground/25 transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"}`}
        >
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="通知"
            className={`liquid-glass-chrome absolute right-0 top-0 flex h-full w-full max-w-sm flex-col border-y-0 border-r-0 transition-transform duration-[250ms] ease-out motion-reduce:transition-none ${visible ? "translate-x-0" : "translate-x-full"}`}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4 shrink-0">
              <h2 className="font-semibold text-sm">通知</h2>
              <Button
                ref={closeButtonRef}
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={handleClose}
                aria-label="閉じる"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Today's summary */}
              <div className="px-5 py-4 space-y-4">
                {notificationData.role === "teacher" ? (
                  <>
                    <Section icon={<BookOpen className="h-3.5 w-3.5 text-muted-foreground" />} label="確認待ちの宿題">
                      {notificationData.pendingHomework.length === 0 ? (
                        <Empty>確認待ちはありません</Empty>
                      ) : (
                        notificationData.pendingHomework.map((h) => (
                          <li key={h.id}>
                            <Link
                              href={`/homework/${h.id}/review`}
                              className="-mx-2 flex min-h-11 items-center rounded-md px-2 text-sm text-foreground hover:bg-muted hover:text-primary"
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
                ) : notificationData.role === "parent" ? (
                  <>
                    <Section icon={<BookOpen className="h-3.5 w-3.5 text-muted-foreground" />} label="期限が近い宿題">
                      {notificationData.homework.length === 0 ? <Empty>要対応の宿題はありません</Empty> : notificationData.homework.map((homework) => (
                        <li key={homework.id} className="flex items-center gap-2">
                          <Link href={`/homework/${homework.id}`} className="-mx-2 flex min-h-11 items-center rounded-md px-2 text-sm hover:bg-muted hover:text-primary" onClick={handleClose}>
                            <span className="mr-1 text-xs text-muted-foreground">{homework.studentName}</span>{homework.title}
                          </Link>
                          {homework.isOverdue && <span className="shrink-0 text-xs text-destructive">期限切れ</span>}
                        </li>
                      ))}
                    </Section>
                    <Section icon={<Calendar className="h-3.5 w-3.5 text-muted-foreground" />} label="今日の授業">
                      {notificationData.lessons.length === 0 ? <Empty>今日の授業はありません</Empty> : notificationData.lessons.map((lesson) => (
                        <li key={lesson.id} className="flex items-center gap-2 text-sm">
                          <span className="shrink-0 text-xs text-muted-foreground">{formatTime(lesson.date)}</span>
                          {lesson.studentName}<span className="text-xs text-muted-foreground">（{lesson.type === "online" ? "オンライン" : "対面"}）</span>
                        </li>
                      ))}
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
                              className="-mx-2 flex min-h-11 items-center rounded-md px-2 text-sm text-foreground hover:bg-muted hover:text-primary"
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
