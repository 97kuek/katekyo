"use client"

import { useRef, useState } from "react"
import { ChevronLeft, Trash2 } from "lucide-react"
import { haptic } from "@/lib/haptic"

type Props = {
  /** スワイプで右側に露出するアクション（編集/削除ボタン等） */
  actions: React.ReactNode
  /** アクション領域の幅(px) */
  actionWidth?: number
  /** 左端まで振り切ったときに実行する破壊的アクション（削除など） */
  onFullSwipe?: () => void
  /** カード本体に付ける追加クラス */
  className?: string
  children: React.ReactNode
}

/**
 * モバイル向けスワイプ可能な行/カード。左スワイプで `actions` を露出する。
 * `onFullSwipe` を渡すと、左端近くまで振り切って離したときにそのアクションを実行する。
 * 本体は `bg-card` の角丸カード。中の <Link> 等はスワイプ中/オープン中はクリックが抑制される。
 */
export function SwipeableRow({
  actions,
  actionWidth = 130,
  onFullSwipe,
  className,
  children,
}: Props) {
  const [offset, setOffset] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [fullArmed, setFullArmed] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const startX = useRef(0)
  const baseOffset = useRef(0)
  const isDragging = useRef(false)
  const didSwipe = useRef(false)

  function fullThreshold() {
    const w = containerRef.current?.offsetWidth ?? 320
    return w * 0.6
  }
  function maxDrag() {
    return onFullSwipe ? (containerRef.current?.offsetWidth ?? 320) : actionWidth
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    isDragging.current = true
    didSwipe.current = false
    startX.current = e.clientX
    baseOffset.current = offset
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging.current) return
    const dx = e.clientX - startX.current
    if (Math.abs(dx) > 5) didSwipe.current = true
    const newOffset = Math.max(-maxDrag(), Math.min(0, baseOffset.current + dx))
    setOffset(newOffset)
    if (onFullSwipe) {
      const armed = -newOffset >= fullThreshold()
      if (armed !== fullArmed) {
        setFullArmed(armed)
        if (armed) haptic.snap()
      }
    }
  }

  function handlePointerUp() {
    if (!isDragging.current) return
    isDragging.current = false
    if (onFullSwipe && -offset >= fullThreshold()) {
      haptic.error()
      setOffset(0)
      setFullArmed(false)
      setIsOpen(false)
      onFullSwipe()
      return
    }
    const snapOpen = offset < -(actionWidth / 2)
    if (snapOpen !== isOpen) haptic.snap()
    setOffset(snapOpen ? -actionWidth : 0)
    setIsOpen(snapOpen)
    setFullArmed(false)
  }

  // オープン中/スワイプ直後はカード内リンクのクリックを抑制
  function handleClickCapture(e: React.MouseEvent) {
    if (isOpen) {
      e.preventDefault()
      e.stopPropagation()
      setOffset(0)
      setIsOpen(false)
      return
    }
    if (didSwipe.current) {
      e.preventDefault()
      e.stopPropagation()
      didSwipe.current = false
    }
  }

  const closed = offset === 0 && !isOpen
  const revealWidth = Math.max(actionWidth, -offset)
  // 左端付近まで振り切っている最中は破壊的アクションの背景を表示
  const showFull = onFullSwipe != null && -offset > actionWidth

  const cardStyle = {
    transform: `translateX(${offset}px)`,
    transition: isDragging.current ? "none" : "transform 0.2s ease-out",
    touchAction: "pan-y" as const,
    willChange: "transform",
  }

  return (
    <div ref={containerRef} className="relative rounded-lg overflow-hidden">
      <div className="absolute inset-y-0 right-0 flex" style={{ width: revealWidth }}>
        {showFull ? (
          <div
            className={`flex-1 flex items-center justify-end gap-2 pr-5 text-sm font-medium transition-colors ${
              fullArmed ? "bg-destructive text-destructive-foreground" : "bg-destructive/60 text-destructive-foreground"
            }`}
          >
            <Trash2 className="h-5 w-5" />
            {fullArmed && <span>離して削除</span>}
          </div>
        ) : (
          actions
        )}
      </div>
      <div
        className={`relative rounded-lg border bg-card p-4 select-none ${className ?? ""}`}
        style={cardStyle}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClickCapture={handleClickCapture}
      >
        {/* 左スワイプ可能を示す控えめなシェブロン（md以上では非表示） */}
        <ChevronLeft
          aria-hidden
          className={`md:hidden pointer-events-none absolute right-0.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30 transition-opacity duration-200 ${closed ? "opacity-100" : "opacity-0"}`}
        />
        {children}
      </div>
    </div>
  )
}
