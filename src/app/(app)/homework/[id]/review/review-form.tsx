"use client"

import { useActionState, useState } from "react"
import { CheckCircle2, Loader2, RotateCcw } from "lucide-react"
import { reviewHomework } from "../actions"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { haptic } from "@/lib/haptic"
import { PendingStatus } from "@/components/ui/pending-status"
import { FormField } from "@/components/ui/form-field"
import { FormMessage } from "@/components/ui/form-message"

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
          <PendingStatus pending={isPending} label="宿題の確認結果を反映しています" />
          <input type="hidden" name="id" value={id} />
          {state.error && (
            <FormMessage type="error">{state.error} コメントを確認してください。</FormMessage>
          )}
          <FormField htmlFor="feedback" label="コメント" hint="承認理由や、次に直してほしい点を具体的に入力します。">
            <Textarea
              id="feedback"
              name="feedback"
              rows={3}
              className="resize-none"
              placeholder="生徒へのコメントを入力してください"
            />
          </FormField>
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
                : <><CheckCircle2 aria-hidden />承認</>
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
                : <><RotateCcw aria-hidden />差し戻し</>
              }
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
