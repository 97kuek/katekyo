import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * フォーム送信ボタンをモバイルでは画面下部（ボトムナビの上）に固定し、
 * デスクトップでは通常フローに戻すラッパー。
 * 中の Button は `w-full md:w-auto` を付けてモバイルで横いっぱいの CTA にするのが想定。
 */
function StickyFormActions({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "sticky bottom-[calc(5rem+env(safe-area-inset-bottom))] z-10 -mx-4 mt-2 border-t border-border bg-muted/85 px-4 py-3 backdrop-blur",
        "md:static md:bottom-auto md:z-auto md:mx-0 md:mt-0 md:border-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-none",
        className
      )}
    >
      {children}
    </div>
  )
}

export { StickyFormActions }
