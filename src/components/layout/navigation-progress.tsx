"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"

const SHOW_DELAY_MS = 150
const FAILSAFE_MS = 15_000

function isInternalNavigation(event: MouseEvent) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return false
  }

  const target = event.target
  if (!(target instanceof Element)) return false

  const anchor = target.closest<HTMLAnchorElement>("a[href]")
  if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return false

  const destination = new URL(anchor.href, window.location.href)
  if (destination.origin !== window.location.origin) return false
  if (destination.pathname === window.location.pathname && destination.search === window.location.search) return false
  return true
}

/**
 * Link を押した瞬間からルート更新までを計測し、150msを超える遷移だけ進捗を表示する。
 * 短い遷移ではバーを出さないため、点滅による体感悪化を避ける。
 */
export function NavigationProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const locationKey = `${pathname}?${searchParams.toString()}`
  const [visible, setVisible] = useState(false)
  const startedAt = useRef<number | null>(null)
  const showTimer = useRef<number | null>(null)
  const failsafeTimer = useRef<number | null>(null)

  useEffect(() => {
    function clearTimers() {
      if (showTimer.current !== null) window.clearTimeout(showTimer.current)
      if (failsafeTimer.current !== null) window.clearTimeout(failsafeTimer.current)
      showTimer.current = null
      failsafeTimer.current = null
    }

    function begin(event: MouseEvent) {
      if (!isInternalNavigation(event)) return

      clearTimers()
      startedAt.current = performance.now()
      performance.mark("katekyo-navigation-start")
      showTimer.current = window.setTimeout(() => setVisible(true), SHOW_DELAY_MS)
      failsafeTimer.current = window.setTimeout(() => {
        startedAt.current = null
        setVisible(false)
        clearTimers()
      }, FAILSAFE_MS)
    }

    document.addEventListener("click", begin, true)
    return () => {
      document.removeEventListener("click", begin, true)
      clearTimers()
    }
  }, [])

  useEffect(() => {
    if (startedAt.current === null) return

    performance.mark("katekyo-navigation-end")
    performance.measure("katekyo-route-transition", "katekyo-navigation-start", "katekyo-navigation-end")
    startedAt.current = null
    if (showTimer.current !== null) window.clearTimeout(showTimer.current)
    if (failsafeTimer.current !== null) window.clearTimeout(failsafeTimer.current)
    showTimer.current = null
    failsafeTimer.current = null
    setVisible(false)
  }, [locationKey])

  return (
    <div
      aria-hidden="true"
      data-navigation-pending={visible ? "true" : "false"}
      className={`pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden transition-opacity duration-150 ${visible ? "opacity-100" : "opacity-0"}`}
    >
      <div className="h-full w-2/5 animate-navigation-progress rounded-r-full bg-primary" />
    </div>
  )
}
