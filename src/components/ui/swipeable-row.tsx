"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronLeft } from "lucide-react"
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
 * スワイプ自体は破壊的操作を実行せず、明示的なアクションだけを露出する。
 * 本体は `bg-card` の角丸カード。中の <Link> 等はスワイプ中/オープン中はクリックが抑制される。
 */
export function SwipeableRow({
  actions,
  actionWidth = 112,
  className,
  children,
}: Props) {
  const [offset, setOffset] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  // transition の切り替えはレンダーで参照するため ref ではなく state で持つ
  const [dragging, setDragging] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const startX = useRef(0)
  const startY = useRef(0)
  const baseOffset = useRef(0)
  const offsetRef = useRef(0)
  const isDragging = useRef(false)
  const didSwipe = useRef(false)
  const axis = useRef<"pending" | "horizontal" | "vertical">("pending")

  useEffect(() => {
    function closeOtherRows(event: Event) {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) {
        offsetRef.current = 0
        setOffset(0)
        setIsOpen(false)
      }
    }
    document.addEventListener("pointerdown", closeOtherRows)
    return () => document.removeEventListener("pointerdown", closeOtherRows)
  }, [])

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    isDragging.current = true
    setDragging(true)
    didSwipe.current = false
    startX.current = e.clientX
    startY.current = e.clientY
    baseOffset.current = offset
    axis.current = "pending"
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
    if (axis.current === "vertical") return
    if (axis.current !== "horizontal") return
    e.preventDefault()
    didSwipe.current = true
    const resistance = Math.max(0, -(baseOffset.current + dx) - actionWidth) * 0.18
    const newOffset = Math.max(-(actionWidth + 18), Math.min(0, baseOffset.current + dx + resistance))
    offsetRef.current = newOffset
    setOffset(newOffset)
  }

  function handlePointerUp() {
    if (!isDragging.current) return
    isDragging.current = false
    setDragging(false)
    if (axis.current === "vertical") return
    const snapOpen = offsetRef.current < -(actionWidth / 2)
    if (snapOpen !== isOpen) haptic.snap()
    offsetRef.current = snapOpen ? -actionWidth : 0
    setOffset(offsetRef.current)
    setIsOpen(snapOpen)
  }

  // オープン中/スワイプ直後はカード内リンクのクリックを抑制
  function handleClickCapture(e: React.MouseEvent) {
    if (isOpen) {
      e.preventDefault()
      e.stopPropagation()
      offsetRef.current = 0
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
    transition: dragging ? "none" : "transform 0.2s ease-out",
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
            offsetRef.current = 0
            setOffset(0)
            setIsOpen(false)
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
