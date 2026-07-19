"use client"

import { useActionState, useState } from "react"
import { Loader2 } from "lucide-react"
import { reviewHomework } from "../actions"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { haptic } from "@/lib/haptic"

export default function ReviewForm({ id }: { id: string }) {
  const [state, action, isPending] = useActionState(reviewHomework, { error: "" })
  const [pendingAction, setPendingAction] = useState<"approved" | "rejected" | null>(null)

  return (
    <Card>
      <CardHeader>
        <CardTitle>フィードバック</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <input type="hidden" name="id" value={id} />
          {state.error && (
            <p className="text-sm text-foreground border border-destructive/30 bg-destructive/10 p-3 rounded-md animate-shake">
              {state.error}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="feedback">コメント（任意）</Label>
            <Textarea
              id="feedback"
              name="feedback"
              rows={3}
              className="resize-none"
              placeholder="生徒へのコメントを入力してください"
            />
          </div>
          <div className="flex gap-3">
            <Button
              type="submit"
              name="action"
              value="approved"
              className="flex-1"
              disabled={isPending}
              onClick={() => { setPendingAction("approved"); haptic.success() }}
            >
              {isPending && pendingAction === "approved"
                ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" />処理中...</>
                : "承認する"
              }
            </Button>
            <Button
              type="submit"
              name="action"
              value="rejected"
              variant="outline"
              className="flex-1 border-destructive/40 text-destructive hover:bg-muted"
              disabled={isPending}
              onClick={() => { setPendingAction("rejected"); haptic.error() }}
            >
              {isPending && pendingAction === "rejected"
                ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" />処理中...</>
                : "差し戻す"
              }
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
