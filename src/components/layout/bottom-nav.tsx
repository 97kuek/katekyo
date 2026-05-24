"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { GraduationCap, LayoutDashboard, ClipboardList, BarChart2, CalendarDays, TreePine, Receipt } from "lucide-react"
import { cn } from "@/lib/utils"

const teacherNav = [
  { href: "/dashboard", label: "ホーム", icon: LayoutDashboard },
  { href: "/students", label: "生徒", icon: GraduationCap },
  { href: "/homework", label: "宿題", icon: ClipboardList },
  { href: "/calendar", label: "予定", icon: CalendarDays },
  { href: "/billing", label: "請求", icon: Receipt },
  { href: "/grades", label: "成績", icon: BarChart2 },
]

const studentNav = [
  { href: "/dashboard", label: "ホーム", icon: LayoutDashboard },
  { href: "/homework", label: "宿題", icon: ClipboardList },
  { href: "/grades", label: "成績", icon: BarChart2 },
  { href: "/calendar", label: "予定", icon: CalendarDays },
  { href: "/garden", label: "森", icon: TreePine },
]

export default function BottomNav({ role }: { role: string }) {
  const pathname = usePathname()
  const navItems = role === "teacher" ? teacherNav : studentNav

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t bg-white md:hidden z-50">
      <div className="flex px-3">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center py-3 gap-1 font-medium transition-colors",
                "text-[11px]",
                active ? "text-primary" : "text-gray-400 hover:text-gray-600"
              )}
            >
              <Icon className="h-6 w-6" />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
