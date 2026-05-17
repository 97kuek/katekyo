"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpen, GraduationCap, LayoutDashboard, Tag, ClipboardList, BarChart2, CalendarDays, HelpCircle, UserCircle, TreePine } from "lucide-react"
import { cn } from "@/lib/utils"

const teacherNav = [
  { href: "/dashboard", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/students", label: "生徒一覧", icon: GraduationCap },
  { href: "/homework", label: "宿題管理", icon: ClipboardList },
  { href: "/grades", label: "成績管理", icon: BarChart2 },
  { href: "/calendar", label: "カレンダー", icon: CalendarDays },
  { href: "/subjects", label: "科目タグ", icon: Tag },
]

const studentNav = [
  { href: "/dashboard", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/homework", label: "宿題", icon: ClipboardList },
  { href: "/grades", label: "成績", icon: BarChart2 },
  { href: "/calendar", label: "カレンダー", icon: CalendarDays },
  { href: "/garden", label: "学習の森", icon: TreePine },
]

const navLinkClass = (active: boolean) =>
  cn(
    "flex items-center justify-center lg:justify-start gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
    active
      ? "bg-white/10 text-white"
      : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
  )

export default function Sidebar({ role }: { role: string }) {
  const pathname = usePathname()
  const navItems = role === "teacher" ? teacherNav : studentNav

  return (
    <aside className="w-16 lg:w-60 shrink-0 bg-slate-900 hidden md:flex flex-col">
      <div className="h-14 flex items-center justify-center lg:justify-start gap-2.5 px-3 lg:px-5 border-b border-white/10">
        <BookOpen className="h-5 w-5 text-indigo-400 shrink-0" />
        <span className="font-bold text-lg tracking-tight hidden lg:block text-white">katekyo</span>
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

      <div className="p-2 lg:p-3 border-t border-white/10 space-y-0.5">
        {[
          { href: "/profile", label: "プロフィール", icon: UserCircle },
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
