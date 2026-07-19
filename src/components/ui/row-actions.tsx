"use client"

import Link from "next/link"
import { MoreHorizontal } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"

export function RowActions({
  editHref,
  confirming,
  onConfirmingChange,
  isPending,
  onDelete,
  className = "",
}: {
  editHref?: string
  confirming: boolean
  onConfirmingChange: (value: boolean) => void
  isPending: boolean
  onDelete: () => void
  className?: string
}) {
  return (
    <details className={`group relative z-10 ${className}`} onToggle={(event) => { if (!(event.currentTarget as HTMLDetailsElement).open) onConfirmingChange(false) }}>
      <summary aria-label="その他の操作" className="flex min-h-9 min-w-9 cursor-pointer list-none items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
        <MoreHorizontal className="h-4 w-4" aria-hidden />
      </summary>
      <div className="absolute bottom-[calc(100%+0.25rem)] right-0 w-40 space-y-1 rounded-lg border bg-popover p-1 shadow-lg">
        {confirming ? (
          <div className="space-y-2 p-2">
            <p className="text-xs text-muted-foreground">削除しますか？</p>
            <div className="flex gap-1">
              <Button type="button" size="xs" variant="destructive" onClick={onDelete} disabled={isPending}>{isPending ? "削除中" : "削除"}</Button>
              <Button type="button" size="xs" variant="ghost" onClick={() => onConfirmingChange(false)}>戻る</Button>
            </div>
          </div>
        ) : (
          <>
            {editHref && <Link href={editHref} className={buttonVariants({ variant: "ghost", size: "sm", className: "w-full justify-start rounded-md font-normal" })}>編集</Link>}
            <Button type="button" variant="ghost" size="sm" className="w-full justify-start rounded-md font-normal text-destructive" onClick={() => onConfirmingChange(true)}>削除</Button>
          </>
        )}
      </div>
    </details>
  )
}
