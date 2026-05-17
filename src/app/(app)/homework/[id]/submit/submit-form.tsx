"use client"

import { useActionState, useState, useRef } from "react"
import { submitHomework } from "../actions"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SubmitForm({ id }: { id: string }) {
  const [state, action, isPending] = useActionState(submitHomework, { error: "" })
  const [preview, setPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) { setPreview(null); return }
    setPreview(URL.createObjectURL(file))
  }

  function handleRemovePhoto() {
    setPreview(null)
    if (fileRef.current) fileRef.current.value = ""
  }

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
            <Label>提出写真（任意）</Label>
            <p className="text-xs text-muted-foreground">宿題の完了ページを1枚撮影して添付できます</p>
            {preview ? (
              <div className="space-y-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="提出写真プレビュー"
                  className="w-full max-h-64 object-contain rounded-md border bg-gray-50"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRemovePhoto}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  写真を削除
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-input rounded-md cursor-pointer hover:bg-muted/50 transition-colors">
                <span className="text-sm text-muted-foreground">タップして写真を選択</span>
                <span className="text-xs text-muted-foreground mt-1">カメラで撮影も可能です（5MB以内）</span>
                <input
                  ref={fileRef}
                  type="file"
                  name="photo"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            )}
          </div>

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
