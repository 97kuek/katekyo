"use client"

import { useRef, useState } from "react"
import { haptic } from "@/lib/haptic"

type Props = {
  /** スワイプで右側に露出するアクション（編集/削除ボタン等） */
  actions: React.ReactNode
  /** アクション領域の幅(px) */
  actionWidth?: number
  /** 最初の1枚にスワイプ可能ヒントアニメを再生 */
  showHint?: boolean
  /** カード本体に付ける追加クラス */
  className?: string
  children: React.ReactNode
}

/**
 * モバイル向けスワイプ可能な行/カード。左スワイプで `actions` を露出する。
 * 本体は `bg-card` の角丸カード。中の <Link> 等はスワイプ中/オープン中はクリックが抑制される。
 */
export function SwipeableRow({
  actions,
  actionWidth = 130,
  showHint = false,
  className,
  children,
}: Props) {
  const [offset, setOffset] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [hintDone, setHintDone] = useState(!showHint)

  const startX = useRef(0)
  const baseOffset = useRef(0)
  const isDragging = useRef(false)
  const didSwipe = useRef(false)

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    setHintDone(true)
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
    const newOffset = Math.max(-actionWidth, Math.min(0, baseOffset.current + dx))
    setOffset(newOffset)
  }

  function handlePointerUp() {
    if (!isDragging.current) return
    isDragging.current = false
    const snapOpen = offset < -(actionWidth / 2)
    if (snapOpen !== isOpen) haptic.snap()
    setOffset(snapOpen ? -actionWidth : 0)
    setIsOpen(snapOpen)
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

  const isAnimating = showHint && !hintDone
  const cardStyle = isAnimating
    ? { touchAction: "pan-y" as const, willChange: "transform" }
    : {
        transform: `translateX(${offset}px)`,
        transition: isDragging.current ? "none" : "transform 0.2s ease-out",
        touchAction: "pan-y" as const,
        willChange: "transform",
      }

  return (
    <div className="relative rounded-lg overflow-hidden">
      <div className="absolute inset-y-0 right-0 flex" style={{ width: actionWidth }}>
        {actions}
      </div>
      <div
        className={`rounded-lg border bg-card p-4 select-none ${className ?? ""} ${isAnimating ? "animate-swipe-hint" : ""}`}
        style={cardStyle}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClickCapture={handleClickCapture}
        onAnimationEnd={() => setHintDone(true)}
      >
        {children}
      </div>
    </div>
  )
}
