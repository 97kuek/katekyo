"use client"

import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

export function PageContent({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  return (
    <div key={pathname} className="animate-page-in">
      {children}
    </div>
  )
}
