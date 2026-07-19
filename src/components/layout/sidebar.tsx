"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpen, HelpCircle, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { desktopNavigation, normalizeRole } from "./navigation-config"

const navLinkClass = (active: boolean) =>
  cn(
    "flex items-center justify-center lg:justify-start gap-3 px-3 py-2 rounded-full text-sm font-medium transition-all duration-150",
    active
      ? "bg-primary text-primary-foreground"
      : "text-muted-foreground hover:bg-muted hover:text-foreground active:scale-[0.97] active:opacity-80"
  )

export default function Sidebar({ role }: { role: string }) {
  const pathname = usePathname()
  const navItems = desktopNavigation[normalizeRole(role)]

  return (
    <aside className="w-16 lg:w-60 shrink-0 bg-background border-r border-border hidden md:flex flex-col">
      <div className="h-14 flex items-center justify-center lg:justify-start gap-2.5 px-3 lg:px-5 border-b border-border">
        <BookOpen className="h-5 w-5 text-primary shrink-0" />
        <span className="font-bold text-lg tracking-tight hidden lg:block text-foreground">katekyo</span>
      </div>

      <nav className="flex-1 p-2 lg:p-3 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/")
          return (
            <Link key={href} href={href} prefetch={true} title={label} aria-current={active ? "page" : undefined} className={navLinkClass(active)}>
              <Icon className="h-4 w-4 shrink-0" />
              <span className="hidden lg:block">{label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-2 lg:p-3 border-t border-border space-y-0.5">
        {[
          { href: "/settings", label: "設定", icon: Settings },
          { href: "/help", label: "使い方ガイド", icon: HelpCircle },
        ].map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} prefetch={true} title={label} aria-current={pathname === href ? "page" : undefined} className={navLinkClass(pathname === href)}>
            <Icon className="h-4 w-4 shrink-0" />
            <span className="hidden lg:block">{label}</span>
          </Link>
        ))}
      </div>
    </aside>
  )
}
