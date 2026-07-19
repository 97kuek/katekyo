"use client"

import { useRouter } from "next/navigation"
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react"
import { RefreshCw } from "lucide-react"
import { haptic } from "@/lib/haptic"
import { rubberband } from "@/lib/spring"
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"

const THRESHOLD = 70
const MAX = 110
/* ラバーバンドの漸近上限。引くほど抵抗が増し、閾値到達には ~165px の実移動が要る */
const RUBBERBAND_DIMENSION = 300

/**
 * モバイルのプルダウン更新。`<main>`（スクロールコンテナ）の最上部から下に引くと
 * router.refresh() で Server Component を再取得する。デスクトップでは touch が発火しないため無効。
 */
export function PullToRefresh({ children }: { children: ReactNode }) {
  const router = useRouter()
  const reduceMotion = usePrefersReducedMotion()
  const wrapRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const active = useRef(false)
  const crossed = useRef(false)
  const [pull, setPull] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  // transition の切り替えはレンダーで参照するため ref ではなく state で持つ
  const [touching, setTouching] = useState(false)
  const [isPending, startTransition] = useTransition()

  // スピナーは固定タイマーではなく router.refresh() の実際の完了で閉じる
  useEffect(() => {
    if (!refreshing || isPending) return
    const id = window.setTimeout(() => {
      setRefreshing(false)
      setPull(0)
    }, 250)
    return () => window.clearTimeout(id)
  }, [refreshing, isPending])

  function onTouchStart(e: React.TouchEvent) {
    if (refreshing || reduceMotion) return
    const scroller = wrapRef.current?.closest("main")
    if (scroller && scroller.scrollTop <= 0) {
      startY.current = e.touches[0].clientY
      active.current = true
      setTouching(true)
      crossed.current = false
    } else {
      active.current = false
      setTouching(false)
    }
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!active.current || refreshing || reduceMotion) return
    const dy = e.touches[0].clientY - startY.current
    if (dy <= 0) {
      setPull(0)
      return
    }
    const p = Math.min(MAX, rubberband(dy, RUBBERBAND_DIMENSION))
    setPull(p)
    if (p >= THRESHOLD && !crossed.current) {
      crossed.current = true
      haptic.snap()
    } else if (p < THRESHOLD) {
      crossed.current = false
    }
  }

  function onTouchEnd() {
    if (reduceMotion) {
      active.current = false
      setTouching(false)
      setPull(0)
      return
    }
    if (!active.current) return
    active.current = false
    setTouching(false)
    if (pull >= THRESHOLD && !refreshing) {
      setRefreshing(true)
      setPull(THRESHOLD)
      startTransition(() => router.refresh())
    } else {
      setPull(0)
    }
  }

  const progress = Math.min(1, pull / THRESHOLD)

  return (
    <div
      ref={wrapRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="relative"
    >
      <div
        className="pointer-events-none absolute left-1/2 z-10 flex items-center justify-center"
        style={{ top: 0, transform: `translate(-50%, ${pull - 40}px)`, opacity: progress }}
      >
        <div className="rounded-full border border-border bg-card p-2 shadow-sm">
          <RefreshCw
            className={`h-5 w-5 text-primary ${refreshing ? "animate-spin" : ""}`}
            style={refreshing ? undefined : { transform: `rotate(${progress * 270}deg)` }}
          />
        </div>
      </div>
      <div
        style={{
          // アイドル時は transform を付けない（sticky 要素の containing block を壊さないため）
          transform: pull > 0 ? `translateY(${pull}px)` : undefined,
          transition: touching ? "none" : "transform 0.25s ease-out",
        }}
      >
        {children}
      </div>
    </div>
  )
}
