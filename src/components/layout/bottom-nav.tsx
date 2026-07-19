"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { isMobileNavigationItemActive, mobileNavigation, normalizeRole } from "./navigation-config"

export default function BottomNav({ role }: { role: string }) {
  const pathname = usePathname()
  const navItems = mobileNavigation[normalizeRole(role)]

  return (
    <nav
      aria-label="主要ナビゲーション"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden"
    >
      <div className="liquid-glass-chrome pointer-events-auto mx-auto flex max-w-lg rounded-3xl p-1.5">
        {navItems.map((item) => {
          const { href, label, icon: Icon } = item
          const active = isMobileNavigationItemActive(pathname, item)
          return (
            <Link
              key={href}
              href={href}
              prefetch={true}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 text-[11px] font-medium",
                "transition-[color,opacity,transform] duration-150 active:scale-[0.97] active:opacity-70 motion-reduce:transform-none motion-reduce:transition-none",
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span
                className={cn(
                  "flex h-7 min-w-8 items-center justify-center rounded-full transition-[color,background-color,box-shadow,transform] duration-200 motion-reduce:transition-none",
                  active ? "bg-primary text-primary-foreground shadow-sm" : "bg-transparent"
                )}
              >
                <Icon className="h-4.5 w-4.5" aria-hidden />
              </span>
              <span className={cn("leading-none", active && "font-semibold")}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
