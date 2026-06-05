"use client"

import { Eye } from "lucide-react"
import { stopViewingAs } from "@/app/(app)/view-as-actions"

export function ViewAsBanner({ studentName }: { studentName: string }) {
  return (
    <div className="bg-warning/10 border-b border-warning/30 px-4 py-2 flex items-center justify-between gap-3 shrink-0">
      <div className="flex items-center gap-2 text-warning-foreground text-sm font-medium">
        <Eye className="h-4 w-4 shrink-0" />
        <span>{studentName}さんの画面を表示中（閲覧のみ・操作は反映されません）</span>
      </div>
      <form action={stopViewingAs}>
        <button
          type="submit"
          className="text-xs text-warning-foreground underline underline-offset-2 whitespace-nowrap hover:text-warning-foreground/70"
        >
          閲覧を終了
        </button>
      </form>
    </div>
  )
}
