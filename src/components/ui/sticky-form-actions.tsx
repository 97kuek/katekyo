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
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <>
      {/* モバイル: 固定バーの高さ分のスペーサー（最後の入力欄が隠れないように） */}
      <div className="h-16 md:hidden" aria-hidden />
      <div
        className={cn(
          "fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-0 right-0 z-30 border-t border-border bg-background/95 px-4 py-3 backdrop-blur",
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
