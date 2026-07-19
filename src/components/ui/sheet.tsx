"use client"

import { Dialog } from "@base-ui/react/dialog"
import { X } from "lucide-react"
import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react"
import { buttonVariants } from "@/components/ui/button"
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"
import { cn } from "@/lib/utils"

type DragPoint = { y: number; time: number }

const PROJECTED_DECELERATION = 0.99

function rubberBand(distance: number) {
  return (distance * 0.35) / (1 + distance / 180)
}

function projectedPosition(current: number, velocity: number) {
  return current + (velocity / 1000) * (PROJECTED_DECELERATION / (1 - PROJECTED_DECELERATION))
}

export function Sheet({
  trigger,
  triggerLabel,
  triggerClassName,
  title,
  description,
  children,
  contentClassName,
}: {
  trigger: ReactNode
  triggerLabel: string
  triggerClassName?: string
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  contentClassName?: string
}) {
  const [open, setOpen] = useState(false)
  const reducedMotion = usePrefersReducedMotion()
  const popupRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)
  const positionRef = useRef(0)
  const velocityRef = useRef(0)
  const dragRef = useRef<{
    pointerId: number
    startPointerY: number
    startPosition: number
    points: DragPoint[]
  } | null>(null)
  const dismissingByDragRef = useRef(false)

  const cancelAnimation = () => {
    if (animationRef.current !== null) cancelAnimationFrame(animationRef.current)
    animationRef.current = null
  }

  const applyPosition = (position: number) => {
    positionRef.current = position
    if (popupRef.current) popupRef.current.style.transform = `translate3d(0, ${position}px, 0)`
    if (backdropRef.current) {
      const height = popupRef.current?.getBoundingClientRect().height ?? window.innerHeight
      const progress = Math.max(0, Math.min(position / Math.max(height * 0.9, 1), 0.82))
      backdropRef.current.style.opacity = String(1 - progress)
    }
  }

  const resetPresentation = () => {
    cancelAnimation()
    positionRef.current = 0
    velocityRef.current = 0
    dragRef.current = null
    dismissingByDragRef.current = false
    if (popupRef.current) {
      popupRef.current.style.removeProperty("transform")
      popupRef.current.removeAttribute("data-dragging")
    }
    backdropRef.current?.style.removeProperty("opacity")
  }

  const springTo = (
    target: number,
    initialVelocity: number,
    { damping, closeWhenFinished }: { damping: number; closeWhenFinished: boolean }
  ) => {
    cancelAnimation()
    const response = 0.3
    const angularFrequency = (2 * Math.PI) / response
    const stiffness = angularFrequency * angularFrequency
    const dampingCoefficient = 2 * damping * angularFrequency
    let position = positionRef.current
    let velocity = initialVelocity
    let previousTime = performance.now()

    popupRef.current?.setAttribute("data-dragging", "")

    const tick = (time: number) => {
      const deltaTime = Math.min((time - previousTime) / 1000, 0.032)
      previousTime = time
      const acceleration = -stiffness * (position - target) - dampingCoefficient * velocity
      velocity += acceleration * deltaTime
      position += velocity * deltaTime
      velocityRef.current = velocity
      applyPosition(position)

      if (Math.abs(position - target) < 0.5 && Math.abs(velocity) < 5) {
        applyPosition(target)
        animationRef.current = null
        popupRef.current?.removeAttribute("data-dragging")
        if (closeWhenFinished) {
          dismissingByDragRef.current = true
          setOpen(false)
        } else {
          resetPresentation()
        }
        return
      }
      animationRef.current = requestAnimationFrame(tick)
    }

    animationRef.current = requestAnimationFrame(tick)
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (window.innerWidth >= 640 || event.button !== 0) return
    cancelAnimation()
    event.currentTarget.setPointerCapture(event.pointerId)
    popupRef.current?.setAttribute("data-dragging", "")
    const time = performance.now()
    dragRef.current = {
      pointerId: event.pointerId,
      startPointerY: event.clientY,
      startPosition: positionRef.current,
      points: [{ y: positionRef.current, time }],
    }
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const proposed = drag.startPosition + event.clientY - drag.startPointerY
    const position = proposed < 0 ? -rubberBand(-proposed) : proposed
    applyPosition(position)

    const now = performance.now()
    drag.points.push({ y: position, time: now })
    drag.points = drag.points.filter((point) => now - point.time <= 120)
  }

  const finishDrag = (event: ReactPointerEvent<HTMLDivElement>, cancelled = false) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    dragRef.current = null

    const first = drag.points[0]
    const last = drag.points.at(-1) ?? first
    const duration = Math.max(last.time - first.time, 1)
    const velocity = cancelled ? 0 : ((last.y - first.y) / duration) * 1000
    velocityRef.current = velocity
    const height = popupRef.current?.getBoundingClientRect().height ?? window.innerHeight
    const shouldDismiss = !cancelled && (
      projectedPosition(positionRef.current, velocity) > height * 0.28
      || velocity > 750
      || positionRef.current > height * 0.42
    )

    if (reducedMotion) {
      if (shouldDismiss) setOpen(false)
      resetPresentation()
      return
    }

    if (shouldDismiss) {
      const target = Math.max(window.innerHeight, height + 48)
      springTo(target, Math.max(velocity, 0), { damping: 0.86, closeWhenFinished: true })
    } else {
      springTo(0, velocity, { damping: 1, closeWhenFinished: false })
    }
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) resetPresentation()
    else if (!dismissingByDragRef.current) resetPresentation()
    setOpen(nextOpen)
  }

  useEffect(() => () => cancelAnimation(), [])

  return (
    <Dialog.Root
      open={open}
      onOpenChange={handleOpenChange}
      onOpenChangeComplete={(isOpen) => {
        if (!isOpen) resetPresentation()
      }}
    >
      <Dialog.Trigger aria-label={triggerLabel} className={triggerClassName}>
        {trigger}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop
          ref={backdropRef}
          className="fixed inset-0 z-[110] bg-foreground/20 opacity-100 backdrop-blur-[2px] transition-opacity duration-300 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 motion-reduce:transition-none"
        />
        <Dialog.Viewport className="fixed inset-0 z-[111] flex items-end justify-center px-0 pt-8 sm:items-center sm:p-6">
          <Dialog.Popup
            ref={popupRef}
            className={cn(
              "liquid-glass-chrome flex max-h-[min(92dvh,56rem)] w-full max-w-2xl origin-bottom flex-col overflow-hidden rounded-t-3xl border-b-0 opacity-100 shadow-2xl outline-none will-change-transform transition-[translate,scale,opacity,filter] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] data-[starting-style]:translate-y-8 data-[starting-style]:scale-[0.985] data-[starting-style]:opacity-0 data-[starting-style]:blur-[4px] data-[ending-style]:translate-y-8 data-[ending-style]:scale-[0.985] data-[ending-style]:opacity-0 data-[ending-style]:blur-[4px] data-[dragging]:transition-none sm:rounded-3xl sm:border-b motion-reduce:translate-none motion-reduce:scale-100 motion-reduce:blur-none motion-reduce:transition-opacity",
              contentClassName
            )}
          >
            <div
              className="flex h-11 shrink-0 touch-none cursor-grab items-center justify-center active:cursor-grabbing sm:hidden"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={finishDrag}
              onPointerCancel={(event) => finishDrag(event, true)}
            >
              <span className="h-1.5 w-10 rounded-full bg-foreground/15" aria-hidden />
            </div>
            <div className="flex shrink-0 items-start justify-between gap-4 px-5 pb-4 pt-1 sm:px-6 sm:pt-5">
              <div className="min-w-0">
                <Dialog.Title className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                  {title}
                </Dialog.Title>
                {description && (
                  <Dialog.Description className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </Dialog.Description>
                )}
              </div>
              <Dialog.Close
                aria-label="閉じる"
                className={buttonVariants({ variant: "secondary", size: "icon-sm", className: "-mr-1 shrink-0" })}
              >
                <X aria-hidden />
              </Dialog.Close>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-border/60 px-5 py-5 sm:px-6">
              {children}
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
