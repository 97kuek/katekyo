"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { LoaderCircle } from "lucide-react"

const SPINNER_DELAY_MS = 1_000
const LONG_WAIT_MS = 4_000
const FAILSAFE_MS = 15_000
type LoadingStage = "idle" | "spinner" | "long"

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
 * Link を押した瞬間からルート更新までを計測する。
 * 1秒未満は何も出さず、1〜4秒はスピナー、4秒以上は長時間用の進捗表示へ切り替える。
 */
export function NavigationProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const locationKey = `${pathname}?${searchParams.toString()}`
  const [stage, setStage] = useState<LoadingStage>("idle")
  const startedAt = useRef<number | null>(null)
  const spinnerTimer = useRef<number | null>(null)
  const longWaitTimer = useRef<number | null>(null)
  const failsafeTimer = useRef<number | null>(null)

  useEffect(() => {
    function clearTimers() {
      if (spinnerTimer.current !== null) window.clearTimeout(spinnerTimer.current)
      if (longWaitTimer.current !== null) window.clearTimeout(longWaitTimer.current)
      if (failsafeTimer.current !== null) window.clearTimeout(failsafeTimer.current)
      spinnerTimer.current = null
      longWaitTimer.current = null
      failsafeTimer.current = null
    }

    function begin(event: MouseEvent) {
      if (!isInternalNavigation(event)) return

      clearTimers()
      startedAt.current = performance.now()
      performance.mark("katekyo-navigation-start")
      spinnerTimer.current = window.setTimeout(() => setStage("spinner"), SPINNER_DELAY_MS)
      longWaitTimer.current = window.setTimeout(() => setStage("long"), LONG_WAIT_MS)
      failsafeTimer.current = window.setTimeout(() => {
        startedAt.current = null
        setStage("idle")
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
    if (spinnerTimer.current !== null) window.clearTimeout(spinnerTimer.current)
    if (longWaitTimer.current !== null) window.clearTimeout(longWaitTimer.current)
    if (failsafeTimer.current !== null) window.clearTimeout(failsafeTimer.current)
    spinnerTimer.current = null
    longWaitTimer.current = null
    failsafeTimer.current = null
    setStage("idle")
  }, [locationKey])

  return (
    <>
      {stage === "spinner" && (
        <div
          role="status"
          aria-live="polite"
          className="translucent-chrome pointer-events-none fixed right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-[100] flex min-h-11 items-center gap-2 rounded-full border bg-background/95 px-3 text-xs font-medium shadow-md backdrop-blur"
        >
          <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
          読み込み中
        </div>
      )}
      {stage === "long" && (
        <div role="status" aria-live="polite" data-navigation-pending="true" className="pointer-events-none fixed inset-x-0 top-0 z-[101]">
          <div className="h-1 overflow-hidden bg-muted">
            <div className="h-full w-2/5 animate-navigation-progress rounded-r-full bg-primary" />
          </div>
          <p className="mx-auto mt-2 w-fit rounded-full border bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-sm">
            読み込みに時間がかかっています。このままお待ちください
          </p>
        </div>
      )}
    </>
  )
}
