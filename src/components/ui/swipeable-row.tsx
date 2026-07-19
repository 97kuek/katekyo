"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ChevronLeft } from "lucide-react"
import { haptic } from "@/lib/haptic"
import { projectMomentum, springTo, type SpringHandle } from "@/lib/spring"

type Props = {
  /** スワイプで右側に露出するアクション（編集/削除ボタン等） */
  actions: React.ReactNode
  /** アクション領域の幅(px) */
  actionWidth?: number
  /** カード本体に付ける追加クラス */
  className?: string
  /** アクション領域の開閉が確定した時に呼ばれる（閉時に確認状態を戻す等に使う） */
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

/**
 * モバイル向けスワイプ可能な行/カード。左スワイプで `actions` を露出する。
 * スワイプ自体は破壊的操作を実行せず、明示的なアクションだけを露出する。
 * スナップはリリース速度から着地点を予測して決め、スプリングが指の速度を
 * 引き継ぐ。アニメーション中に掴み直しても現在位置から継続する。
 * 本体は `bg-card` の角丸カード。中の <Link> 等はスワイプ中/オープン中はクリックが抑制される。
 */
export function SwipeableRow({
  actions,
  actionWidth = 112,
  className,
  onOpenChange,
  children,
}: Props) {
  const [offset, setOffset] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const startX = useRef(0)
  const startY = useRef(0)
  const baseOffset = useRef(0)
  const offsetRef = useRef(0)
  const isDragging = useRef(false)
  const didSwipe = useRef(false)
  const axis = useRef<"pending" | "horizontal" | "vertical">("pending")
  const spring = useRef<SpringHandle | null>(null)
  // リリース速度算出用の直近の移動履歴
  const history = useRef<{ x: number; t: number }[]>([])
  const isOpenRef = useRef(false)
  const onOpenChangeRef = useRef(onOpenChange)
  useEffect(() => {
    onOpenChangeRef.current = onOpenChange
  })

  const minOffset = -(actionWidth + 18)

  const setPosition = useCallback(
    (value: number) => {
      const clamped = Math.max(minOffset, Math.min(0, value))
      offsetRef.current = clamped
      setOffset(clamped)
    },
    [minOffset]
  )

  const animateTo = useCallback(
    (target: number, velocity = 0) => {
      spring.current?.stop()
      spring.current = springTo({
        from: offsetRef.current,
        to: target,
        velocity,
        damping: 1,
        response: 0.3,
        onUpdate: setPosition,
      })
      const nextOpen = target !== 0
      if (isOpenRef.current !== nextOpen) {
        isOpenRef.current = nextOpen
        onOpenChangeRef.current?.(nextOpen)
      }
      setIsOpen(nextOpen)
    },
    [setPosition]
  )

  useEffect(() => {
    function closeOtherRows(event: Event) {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) {
        if (offsetRef.current !== 0) animateTo(0)
      }
    }
    document.addEventListener("pointerdown", closeOtherRows)
    const activeSpring = spring
    return () => {
      document.removeEventListener("pointerdown", closeOtherRows)
      activeSpring.current?.stop()
    }
  }, [animateTo])

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    // アニメーション中に掴んだら現在の表示値から継続する（ジャンプさせない）。
    // スプリングはオーバーシュートで境界外の値を持ちうるため、クランプ済みの
    // setPosition を通して表示値と一致させる
    if (spring.current) {
      const { value } = spring.current.stop()
      spring.current = null
      setPosition(value)
    }
    isDragging.current = true
    didSwipe.current = false
    startX.current = e.clientX
    startY.current = e.clientY
    baseOffset.current = offsetRef.current
    axis.current = "pending"
    history.current = [{ x: e.clientX, t: e.timeStamp }]
    // アクティブでないポインタ id だと setPointerCapture が NotFoundError を投げるためガードする
    try {
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    } catch {}
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging.current) return
    const dx = e.clientX - startX.current
    const dy = e.clientY - startY.current
    if (axis.current === "pending" && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      axis.current = Math.abs(dx) > Math.abs(dy) * 1.2 ? "horizontal" : "vertical"
    }
    if (axis.current !== "horizontal") return
    e.preventDefault()
    didSwipe.current = true
    history.current.push({ x: e.clientX, t: e.timeStamp })
    if (history.current.length > 6) history.current.shift()
    const resistance = Math.max(0, -(baseOffset.current + dx) - actionWidth) * 0.18
    setPosition(baseOffset.current + dx + resistance)
  }

  function releaseVelocity(releaseT: number): number {
    // 直近 ~100ms の移動から速度(px/s)を出す。フリック後に指を止めてから
    // 離した場合は古い速度を使わずゼロ扱いにする
    const samples = history.current
    const now = samples[samples.length - 1]
    if (!now || releaseT - now.t > 100) return 0
    const past = samples.find((s) => now.t - s.t <= 100) ?? samples[0]
    if (!past || now.t === past.t) return 0
    return ((now.x - past.x) / (now.t - past.t)) * 1000
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (!isDragging.current) return
    isDragging.current = false
    if (axis.current === "vertical") {
      // スプリング中断→縦スクロールだった場合も、中途半端な位置に置き去りにせず近い側へ沈める
      if (offsetRef.current !== 0 && offsetRef.current !== -actionWidth) {
        animateTo(offsetRef.current < -(actionWidth / 2) ? -actionWidth : 0)
      }
      return
    }
    // 離した位置ではなく、慣性の着地点でスナップ先を決める
    const velocity = releaseVelocity(e.timeStamp)
    const projected = offsetRef.current + projectMomentum(velocity)
    const snapOpen = projected < -(actionWidth / 2)
    if (snapOpen !== isOpen) haptic.snap()
    animateTo(snapOpen ? -actionWidth : 0, velocity)
  }

  // オープン中/スワイプ直後はカード内リンクのクリックを抑制
  function handleClickCapture(e: React.MouseEvent) {
    if (isOpen) {
      e.preventDefault()
      e.stopPropagation()
      animateTo(0)
      return
    }
    if (didSwipe.current) {
      e.preventDefault()
      e.stopPropagation()
      didSwipe.current = false
    }
  }

  const closed = offset === 0 && !isOpen
  const cardStyle = {
    transform: `translateX(${offset}px)`,
    touchAction: "pan-y" as const,
    willChange: "transform",
  }

  return (
    <div ref={containerRef} className="relative rounded-lg overflow-hidden">
      <div className="absolute inset-y-0 right-0 flex bg-muted" style={{ width: actionWidth }} aria-hidden={!isOpen} inert={!isOpen}>
        {actions}
      </div>
      <div
        className={`relative rounded-lg border bg-card p-4 select-none ${className ?? ""}`}
        style={cardStyle}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            animateTo(0)
          }
        }}
        onClickCapture={handleClickCapture}
        aria-label="左にスワイプして操作を表示"
      >
        {/* 左スワイプ可能を示す控えめなシェブロン（md以上では非表示） */}
        <span
          aria-hidden
          className={`pointer-events-none absolute right-1 top-1/2 flex -translate-y-1/2 items-center rounded-full bg-muted/90 px-1 py-0.5 text-[10px] text-muted-foreground shadow-sm transition-opacity duration-200 md:hidden ${closed ? "opacity-100" : "opacity-0"}`}
        >
          <ChevronLeft className="h-3 w-3" />操作
        </span>
        {children}
      </div>
    </div>
  )
}
