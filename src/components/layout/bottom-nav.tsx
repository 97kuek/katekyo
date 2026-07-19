"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { mobileNavigation, normalizeRole } from "./navigation-config"

export default function BottomNav({ role }: { role: string }) {
  const pathname = usePathname()
  const navItems = mobileNavigation[normalizeRole(role)]

  return (
    <nav className="translucent-chrome fixed bottom-0 left-0 right-0 border-t border-border bg-background/80 backdrop-blur-xl md:hidden z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-lg px-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2.5 font-medium transition-all duration-200 active:opacity-60",
                "text-[11px]",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span
                className={cn(
                  "absolute top-0 h-0.5 rounded-full bg-primary transition-all duration-200",
                  active ? "w-8 opacity-100" : "w-0 opacity-0"
                )}
              />
              <Icon
                className={cn(
                  "h-5 w-5 transition-transform duration-200",
                  active ? "scale-110" : "scale-100"
                )}
              />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
