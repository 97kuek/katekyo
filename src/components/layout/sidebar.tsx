"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpen, GraduationCap, LayoutDashboard, ClipboardList, BarChart2, CalendarDays, HelpCircle, TreePine, Receipt, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

const teacherNav = [
  { href: "/dashboard", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/students", label: "生徒一覧", icon: GraduationCap },
  { href: "/homework", label: "宿題管理", icon: ClipboardList },
  { href: "/grades", label: "成績管理", icon: BarChart2 },
  { href: "/calendar", label: "カレンダー", icon: CalendarDays },
  { href: "/billing", label: "請求管理", icon: Receipt },
]

const studentNav = [
  { href: "/dashboard", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/homework", label: "宿題", icon: ClipboardList },
  { href: "/grades", label: "成績", icon: BarChart2 },
  { href: "/calendar", label: "カレンダー", icon: CalendarDays },
  { href: "/materials", label: "教材", icon: BookOpen },
  { href: "/garden", label: "学習の森", icon: TreePine },
]

const parentNav = [
  { href: "/dashboard", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/grades", label: "成績", icon: BarChart2 },
  { href: "/calendar", label: "カレンダー", icon: CalendarDays },
  { href: "/billing", label: "請求", icon: Receipt },
]

const navLinkClass = (active: boolean) =>
  cn(
    "flex items-center justify-center lg:justify-start gap-3 px-3 py-2 rounded-full text-sm font-medium transition-colors",
    active
      ? "bg-primary text-primary-foreground"
      : "text-muted-foreground hover:bg-muted hover:text-foreground"
  )

export default function Sidebar({ role }: { role: string }) {
  const pathname = usePathname()
  const navItems = role === "teacher" ? teacherNav : role === "parent" ? parentNav : studentNav

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
            <Link key={href} href={href} title={label} className={navLinkClass(active)}>
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
          <Link key={href} href={href} title={label} className={navLinkClass(pathname === href)}>
            <Icon className="h-4 w-4 shrink-0" />
            <span className="hidden lg:block">{label}</span>
          </Link>
        ))}
      </div>
    </aside>
  )
}
