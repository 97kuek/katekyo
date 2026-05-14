"use client"

import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export default function Header({ name }: { name: string }) {
  return (
    <header className="h-14 border-b bg-white flex items-center justify-between px-6 shrink-0">
      <span className="text-sm text-muted-foreground">{name}</span>
      <Button
        variant="ghost"
        size="sm"
        className="gap-2"
        onClick={() => signOut({ callbackUrl: "/login" })}
      >
        <LogOut className="h-4 w-4" />
        ログアウト
      </Button>
    </header>
  )
}
