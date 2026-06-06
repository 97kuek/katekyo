"use client"

import { useTransition } from "react"
import { Eye, Loader2 } from "lucide-react"
import { startViewingAs } from "@/app/(app)/view-as-actions"
import { Button } from "@/components/ui/button"

export function ViewAsButton({ studentId }: { studentId: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      type="button"
      variant="ghost"
      size="xs"
      disabled={isPending}
      title="生徒として表示"
      onClick={() => startTransition(async () => { await startViewingAs(studentId) })}
    >
      {isPending ? (
        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
      ) : (
        <Eye className="h-3 w-3 mr-1" />
      )}
      {isPending ? "切替中..." : "生徒画面"}
    </Button>
  )
}
