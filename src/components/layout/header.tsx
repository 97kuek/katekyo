"use client"

import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { BookOpen, ChevronDown, HelpCircle, LogOut, Settings, UserRound } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import ChangelogBell from "@/components/notifications/changelog-bell"
import type { NotificationData } from "@/lib/changelog"
import { getPageTitle } from "./navigation-config"

export default function Header({ name, notificationData }: { name: string; notificationData: NotificationData }) {
  const pathname = usePathname()
  const title = getPageTitle(pathname)

  return (
    <header className="h-14 border-b border-border bg-background flex items-center justify-between px-4 md:px-6 shrink-0">
      {/* モバイルでは現在地（ページタイトル）を優先し、無い画面ではブランド名を出す */}
      <div className="flex items-center gap-2 md:hidden min-w-0">
        <BookOpen className="h-5 w-5 text-primary shrink-0" />
        <span className="font-bold tracking-tight truncate">{title || "katekyo"}</span>
      </div>
      <span className="text-sm font-semibold hidden md:block">{title}</span>
      <div className="flex items-center gap-1.5">
        <ChangelogBell notificationData={notificationData} />
        <details className="group relative">
          <summary
            aria-label="アカウントメニューを開く"
            className="flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center gap-1 rounded-full px-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden"
          >
            <UserRound className="h-4 w-4" aria-hidden />
            <span className="hidden max-w-28 truncate text-xs sm:inline">{name}</span>
            <ChevronDown className="hidden h-3.5 w-3.5 transition-transform group-open:rotate-180 motion-reduce:transform-none motion-reduce:transition-none sm:block" aria-hidden />
          </summary>
          <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-52 overflow-hidden rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg">
            <Link href="/profile" className="flex min-h-11 items-center gap-2 rounded-md px-3 text-sm hover:bg-muted active:opacity-70">
              <UserRound className="h-4 w-4" aria-hidden />プロフィール
            </Link>
            <Link href="/settings" className="flex min-h-11 items-center gap-2 rounded-md px-3 text-sm hover:bg-muted active:opacity-70">
              <Settings className="h-4 w-4" aria-hidden />設定
            </Link>
            <Link href="/help" className="flex min-h-11 items-center gap-2 rounded-md px-3 text-sm hover:bg-muted active:opacity-70">
              <HelpCircle className="h-4 w-4" aria-hidden />使い方ガイド
            </Link>
            <div className="my-1 border-t" />
            <Button
              variant="ghost"
              className="h-11 w-full justify-start gap-2 rounded-md px-3 text-sm font-normal text-destructive md:h-10"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="h-4 w-4" aria-hidden />ログアウト
            </Button>
          </div>
        </details>
      </div>
    </header>
  )
}
