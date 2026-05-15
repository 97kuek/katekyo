"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpen, GraduationCap, LayoutDashboard, Tag, ClipboardList, BarChart2, CalendarDays, HelpCircle, UserCircle } from "lucide-react"
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
    <aside className="w-16 lg:w-60 shrink-0 border-r bg-white hidden md:flex flex-col">
      <div className="h-14 flex items-center justify-center lg:justify-start gap-2 px-3 lg:px-5 border-b">
        <BookOpen className="h-5 w-5 text-primary shrink-0" />
        <span className="font-bold text-lg tracking-tight hidden lg:block">katekyo</span>
      </div>
      <nav className="flex-1 p-2 lg:p-3 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            title={label}
            className={cn(
              "flex items-center justify-center lg:justify-start gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              pathname === href || pathname.startsWith(href + "/")
                ? "bg-gray-100 text-gray-900"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="hidden lg:block">{label}</span>
          </Link>
        ))}
      </nav>
      <div className="p-2 lg:p-3 border-t space-y-1">
        <Link
          href="/profile"
          title="プロフィール"
          className={cn(
            "flex items-center justify-center lg:justify-start gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
            pathname === "/profile"
              ? "bg-gray-100 text-gray-900"
              : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
          )}
        >
          <UserCircle className="h-4 w-4 shrink-0" />
          <span className="hidden lg:block">プロフィール</span>
        </Link>
        <Link
          href="/help"
          title="使い方ガイド"
          className={cn(
            "flex items-center justify-center lg:justify-start gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
            pathname === "/help"
              ? "bg-gray-100 text-gray-900"
              : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
          )}
        >
          <HelpCircle className="h-4 w-4 shrink-0" />
          <span className="hidden lg:block">使い方ガイド</span>
        </Link>
      </div>
    </aside>
  )
}
