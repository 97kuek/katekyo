"use client"

import { useEffect, useRef, useState } from "react"
import { Bell, X } from "lucide-react"
import { CHANGELOG, LATEST_CHANGELOG_ID } from "@/lib/changelog"

const STORAGE_KEY = "lastSeenChangelogId"

export default function ChangelogBell() {
  const [hasUnread, setHasUnread] = useState(false)
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY)
    setHasUnread(seen !== LATEST_CHANGELOG_ID)
  }, [])

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        handleClose()
      }
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
        className="relative inline-flex items-center justify-center rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        aria-label="アップデート情報"
      >
        <Bell className="h-4 w-4" />
        {hasUnread && (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/30" aria-hidden="true">
          <div
            ref={panelRef}
            className="absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-xl flex flex-col"
          >
            <div className="flex items-center justify-between border-b px-5 py-4 shrink-0">
              <div>
                <h2 className="font-semibold text-sm">アップデート情報</h2>
                <p className="text-xs text-gray-500 mt-0.5">最新の変更点をお知らせします</p>
              </div>
              <button
                onClick={handleClose}
                className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                aria-label="閉じる"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
              {CHANGELOG.map((entry) => (
                <div key={entry.id}>
                  <p className="text-xs text-gray-400 mb-1">{entry.date}</p>
                  <h3 className="text-sm font-medium mb-2">{entry.title}</h3>
                  <ul className="space-y-1.5">
                    {entry.items.map((item, i) => (
                      <li key={i} className="flex gap-2 text-sm text-gray-600">
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
      )}
    </>
  )
}
