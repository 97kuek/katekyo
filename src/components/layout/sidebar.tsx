"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpen, GraduationCap, LayoutDashboard, Tag, ClipboardList, BarChart2, CalendarDays } from "lucide-react"
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
]

export default function Sidebar({ role }: { role: string }) {
  const pathname = usePathname()
  const navItems = role === "teacher" ? teacherNav : studentNav

  return (
    <aside className="w-60 shrink-0 border-r bg-white hidden md:flex flex-col">
      <div className="h-14 flex items-center gap-2 px-5 border-b">
        <BookOpen className="h-5 w-5 text-primary" />
        <span className="font-bold text-lg tracking-tight">katekyo</span>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              pathname === href
                ? "bg-gray-100 text-gray-900"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
