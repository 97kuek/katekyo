"use client"

import { useActionState, useEffect, useTransition, useState } from "react"
import { createTemplate, deleteTemplate } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Trash2, Plus } from "lucide-react"

type Template = { id: string; title: string; description: string | null }

function DeleteButton({ id }: { id: string }) {
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-gray-600">削除?</span>
        <button
          onClick={() => startTransition(async () => {
            const fd = new FormData()
            fd.append("id", id)
            await deleteTemplate(fd)
          })}
          disabled={isPending}
          className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
        >
          {isPending ? "..." : "削除"}
        </button>
        <button onClick={() => setConfirming(false)} className="text-xs text-gray-400">✕</button>
      </div>
    )
  }
  return (
    <button onClick={() => setConfirming(true)} className="text-red-400 hover:text-red-600">
      <Trash2 className="h-4 w-4" />
    </button>
  )
}

export default function TemplateManager({ templates }: { templates: Template[] }) {
  const [state, action, isPending] = useActionState(createTemplate, { error: "" })
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    if (!state.timestamp) return
    setShowForm(false)
    toast.success("テンプレートを追加しました")
  }, [state.timestamp])

  return (
    <div className="space-y-4">
      {templates.length === 0 && !showForm ? (
        <div className="rounded-lg border bg-white p-10 text-center space-y-3">
          <p className="text-sm text-muted-foreground">テンプレートがまだありません</p>
          <Button onClick={() => setShowForm(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" /> テンプレートを追加
          </Button>
        </div>
      ) : (
        <>
          {templates.length > 0 && (
            <div className="rounded-lg border bg-white divide-y">
              {templates.map((t) => (
                <div key={t.id} className="flex items-start justify-between gap-3 px-5 py-4">
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{t.title}</p>
                    {t.description && <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>}
                  </div>
                  <DeleteButton id={t.id} />
                </div>
              ))}
            </div>
          )}

          {showForm ? (
            <div className="rounded-lg border bg-white p-4 space-y-3">
              <h3 className="font-medium text-sm">テンプレートを追加</h3>
              <form action={action} className="space-y-3">
                {state.error && (
                  <p className="text-xs text-red-600 bg-red-50 p-2 rounded">{state.error}</p>
                )}
                <div className="space-y-1">
                  <Label htmlFor="title" className="text-xs">タイトル <span className="text-destructive">*</span></Label>
                  <Input id="title" name="title" required placeholder="例: 英単語50問" autoFocus />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="description" className="text-xs">内容（任意）</Label>
                  <textarea
                    id="description"
                    name="description"
                    rows={2}
                    placeholder="詳細な指示があれば入力してください"
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={isPending}>
                    {isPending ? "追加中..." : "追加"}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>
                    キャンセル
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <Button onClick={() => setShowForm(true)} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" /> テンプレートを追加
            </Button>
          )}
        </>
      )}
    </div>
  )
}
