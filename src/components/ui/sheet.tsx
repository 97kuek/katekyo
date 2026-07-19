"use client"

import { Dialog } from "@base-ui/react/dialog"
import { X } from "lucide-react"
import type { ReactNode } from "react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

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
  return (
    <Dialog.Root>
      <Dialog.Trigger aria-label={triggerLabel} className={triggerClassName}>
        {trigger}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[110] bg-foreground/20 opacity-100 backdrop-blur-[2px] transition-opacity duration-300 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 motion-reduce:transition-none" />
        <Dialog.Viewport className="fixed inset-0 z-[111] flex items-end justify-center px-0 pt-8 sm:items-center sm:p-6">
          <Dialog.Popup
            className={cn(
              "liquid-glass-chrome flex max-h-[min(92dvh,56rem)] w-full max-w-2xl origin-bottom flex-col overflow-hidden rounded-t-3xl border-b-0 opacity-100 shadow-2xl outline-none transition-[transform,opacity,filter] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] data-[starting-style]:translate-y-8 data-[starting-style]:scale-[0.985] data-[starting-style]:opacity-0 data-[starting-style]:blur-[4px] data-[ending-style]:translate-y-8 data-[ending-style]:scale-[0.985] data-[ending-style]:opacity-0 data-[ending-style]:blur-[4px] sm:rounded-3xl sm:border-b motion-reduce:transform-none motion-reduce:blur-none motion-reduce:transition-opacity",
              contentClassName
            )}
          >
            <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-foreground/15 sm:hidden" aria-hidden />
            <div className="flex shrink-0 items-start justify-between gap-4 px-5 pb-4 pt-4 sm:px-6 sm:pt-5">
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
