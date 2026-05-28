"use client"

import { Eye } from "lucide-react"
import { startViewingAs } from "@/app/(app)/view-as-actions"
import { buttonVariants } from "@/components/ui/button"

export function ViewAsButton({ studentId }: { studentId: string }) {
  return (
    <form action={startViewingAs.bind(null, studentId)}>
      <button
        type="submit"
        className={buttonVariants({ variant: "ghost", size: "xs" })}
        title="生徒として表示"
      >
        <Eye className="h-3 w-3 mr-1" />
        生徒画面
      </button>
    </form>
  )
}
