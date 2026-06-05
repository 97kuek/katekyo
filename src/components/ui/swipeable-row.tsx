"use client"

import { useRef, useState } from "react"
import { GripVertical } from "lucide-react"
import { haptic } from "@/lib/haptic"

type Props = {
  /** スワイプで右側に露出するアクション（編集/削除ボタン等） */
  actions: React.ReactNode
  /** アクション領域の幅(px) */
  actionWidth?: number
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
  className,
  children,
}: Props) {
  const [offset, setOffset] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  const startX = useRef(0)
  const baseOffset = useRef(0)
  const isDragging = useRef(false)
  const didSwipe = useRef(false)

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

  const closed = offset === 0 && !isOpen
  const cardStyle = {
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
        className={`relative rounded-lg border bg-card p-4 select-none ${className ?? ""}`}
        style={cardStyle}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClickCapture={handleClickCapture}
      >
        {/* スワイプ可能を示す控えめなグリップ（md以上では非表示） */}
        <GripVertical
          aria-hidden
          className={`md:hidden pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/25 transition-opacity duration-200 ${closed ? "opacity-100" : "opacity-0"}`}
        />
        {children}
      </div>
    </div>
  )
}
