"use client"

import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { BookOpen, LogOut, HelpCircle } from "lucide-react"
import Link from "next/link"

export default function Header({ name }: { name: string }) {
  return (
    <header className="h-14 border-b bg-white flex items-center justify-between px-4 md:px-6 shrink-0">
      <div className="flex items-center gap-2 md:hidden">
        <BookOpen className="h-5 w-5 text-primary" />
        <span className="font-bold tracking-tight">katekyo</span>
      </div>
      <span className="text-sm text-muted-foreground hidden md:block">{name}</span>
      <div className="flex items-center gap-1">
        <Link href="/help" className="inline-flex items-center justify-center rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors md:hidden">
          <HelpCircle className="h-4 w-4" />
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">ログアウト</span>
        </Button>
      </div>
    </header>
  )
}
