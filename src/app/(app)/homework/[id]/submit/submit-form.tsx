"use client"

import { useActionState } from "react"
import { submitHomework } from "../actions"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SubmitForm({ id }: { id: string }) {
  const [state, action, isPending] = useActionState(submitHomework, { error: "" })

  return (
    <Card>
      <CardHeader>
        <CardTitle>提出する</CardTitle>
        <CardDescription>完了したことを先生に報告します</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <input type="hidden" name="id" value={id} />
          {state.error && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{state.error}</p>
          )}
          <div className="space-y-2">
            <Label htmlFor="note">先生へのコメント（任意）</Label>
            <textarea
              id="note"
              name="note"
              rows={4}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              placeholder="質問や報告があれば入力してください"
            />
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "提出中..." : "提出する"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
