"use client"

import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { BookOpen, LogOut, HelpCircle, Settings } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import ChangelogBell from "@/components/notifications/changelog-bell"
import type { NotificationData } from "@/lib/changelog"

const PAGE_TITLES: { pattern: (p: string) => boolean; label: string }[] = [
  { pattern: (p) => p === "/dashboard", label: "ダッシュボード" },
  { pattern: (p) => p === "/students/invite", label: "生徒を招待" },
  { pattern: (p) => p === "/students/invites", label: "招待管理" },
  { pattern: (p) => p.startsWith("/students/") && p.endsWith("/grades"), label: "生徒の成績" },
  { pattern: (p) => p.startsWith("/students/") && p.endsWith("/materials"), label: "教材管理" },
  { pattern: (p) => p === "/students", label: "生徒一覧" },
  { pattern: (p) => p === "/homework/new", label: "宿題を作成" },
  { pattern: (p) => p === "/billing", label: "請求管理" },
  { pattern: (p) => p.endsWith("/review"), label: "宿題を確認" },
  { pattern: (p) => p.endsWith("/submit"), label: "宿題を提出" },
  { pattern: (p) => p.endsWith("/edit"), label: "編集" },
  { pattern: (p) => p.startsWith("/homework/"), label: "宿題の詳細" },
  { pattern: (p) => p === "/homework", label: "宿題管理" },
  { pattern: (p) => p === "/grades/new", label: "成績を記録" },
  { pattern: (p) => p === "/grades", label: "成績管理" },
  { pattern: (p) => p === "/calendar", label: "カレンダー" },
  { pattern: (p) => p === "/materials", label: "教材" },
  { pattern: (p) => p === "/profile", label: "プロフィール" },
  { pattern: (p) => p === "/help", label: "使い方ガイド" },
  { pattern: (p) => p === "/settings", label: "設定" },
]

function getPageTitle(pathname: string): string {
  return PAGE_TITLES.find(({ pattern }) => pattern(pathname))?.label ?? ""
}

export default function Header({ name, notificationData }: { name: string; notificationData: NotificationData }) {
  const pathname = usePathname()
  const title = getPageTitle(pathname)

  return (
    <header className="h-14 border-b border-border bg-background flex items-center justify-between px-4 md:px-6 shrink-0">
      <div className="flex items-center gap-2 md:hidden min-w-0">
        <BookOpen className="h-5 w-5 text-primary shrink-0" />
        <span className="font-bold tracking-tight">katekyo</span>
      </div>
      <span className="text-sm font-semibold hidden md:block">{title}</span>
      <div className="flex items-center gap-1">
        <ChangelogBell notificationData={notificationData} />
        <Link href="/settings" className="inline-flex items-center justify-center rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors md:hidden">
          <Settings className="h-4 w-4" />
        </Link>
        <Link href="/help" className="inline-flex items-center justify-center rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors md:hidden">
          <HelpCircle className="h-4 w-4" />
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline text-xs">{name}</span>
        </Button>
      </div>
    </header>
  )
}
