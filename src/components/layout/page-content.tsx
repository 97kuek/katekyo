"use client"

import { usePathname } from "next/navigation"
import { useEffect, useRef, type ReactNode } from "react"

export function PageContent({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const ref = useRef<HTMLDivElement>(null)

  // <main> がスクロールコンテナのため、ページ遷移時に手動でトップへ戻す
  // （Next 標準のスクロール復元は window スクロール前提で効かない）
  useEffect(() => {
    const scroller = ref.current?.closest("main")
    if (scroller) scroller.scrollTop = 0
  }, [pathname])

  return (
    <div ref={ref} key={pathname} className="animate-page-in">
      {children}
    </div>
  )
}
