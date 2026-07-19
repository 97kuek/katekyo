"use client"

import { Eye } from "lucide-react"
import { stopViewingAs } from "@/app/(app)/view-as-actions"
import { Button } from "@/components/ui/button"

export function ViewAsBanner({ studentName }: { studentName: string }) {
  return (
    <div className="bg-warning/10 border-b border-warning/30 px-4 py-2 flex items-center justify-between gap-3 shrink-0">
      <div className="flex items-center gap-2 text-warning-foreground text-sm font-medium">
        <Eye className="h-4 w-4 shrink-0" />
        <span>{studentName}さんの画面を表示中（閲覧のみ・操作は反映されません）</span>
      </div>
      <form action={stopViewingAs}>
        <Button
          type="submit"
          variant="outline"
          size="xs"
          className="border-warning/40 bg-transparent text-warning-foreground hover:bg-warning/10 hover:text-warning-foreground"
        >
          閲覧を終了
        </Button>
      </form>
    </div>
  )
}
