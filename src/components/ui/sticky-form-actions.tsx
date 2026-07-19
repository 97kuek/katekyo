import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * フォーム送信ボタンをモバイルでは画面下部（ボトムナビの上）に固定し、
 * デスクトップでは通常フローに戻すラッパー。
 *
 * モバイルでは `fixed` バー＋同じ高さのスペーサーで実装する。スペーサーが
 * フォーム末尾に高さを確保するため、直前の入力欄がバーに隠れない。
 * 中の Button は `w-full md:w-auto` を付けてモバイルで横いっぱいの CTA にするのが想定。
 */
function StickyFormActions({
  className,
  children,
  contained = false,
}: {
  className?: string
  children: React.ReactNode
  contained?: boolean
}) {
  if (contained) {
    return (
      <div className={cn("sticky -bottom-5 -mx-5 z-20 mt-6 border-t border-border/60 bg-background px-5 py-3 shadow-[0_-8px_20px_oklch(0.16_0.02_250_/_0.06)] sm:-mx-6 sm:px-6", className)}>
        {children}
      </div>
    )
  }

  return (
    <>
      {/* モバイル: 固定バーの高さ分のスペーサー（最後の入力欄が隠れないように） */}
      <div className="h-16 md:hidden" aria-hidden />
      <div
        className={cn(
          "translucent-chrome fixed bottom-[var(--mobile-nav-clearance)] left-0 right-0 z-30 border-t border-border bg-background/95 px-4 py-3 backdrop-blur",
          "md:static md:bottom-auto md:left-auto md:right-auto md:z-auto md:border-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-none",
          className
        )}
      >
        {children}
      </div>
    </>
  )
}

export { StickyFormActions }
