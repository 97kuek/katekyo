"use client"

import { useActionState } from "react"
import { reviewHomework } from "../actions"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ReviewForm({ id }: { id: string }) {
  const [state, action, isPending] = useActionState(reviewHomework, { error: "" })

  return (
    <Card>
      <CardHeader>
        <CardTitle>フィードバック</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <input type="hidden" name="id" value={id} />
          {state.error && (
            <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{state.error}</p>
          )}
          <div className="space-y-2">
            <Label htmlFor="feedback">コメント（任意）</Label>
            <textarea
              id="feedback"
              name="feedback"
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
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
            >
              承認する
            </Button>
            <Button
              type="submit"
              name="action"
              value="rejected"
              variant="outline"
              className="flex-1 border-destructive/40 text-destructive hover:bg-destructive/5"
              disabled={isPending}
            >
              差し戻す
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
