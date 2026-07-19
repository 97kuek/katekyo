"use client"

import { startTransition, useActionState, useState, useRef } from "react"
import { submitHomework } from "../actions"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DifficultyBars } from "@/components/homework/difficulty-bars"
import { StickyFormActions } from "@/components/ui/sticky-form-actions"
import { PendingStatus } from "@/components/ui/pending-status"
import { FormField, FormFieldLabel } from "@/components/ui/form-field"
import { FormMessage } from "@/components/ui/form-message"
import { ImagePlus, LoaderCircle, Send, Trash2 } from "lucide-react"

const DIFFICULTIES = [
  { value: 1, label: "かんたん" },
  { value: 2, label: "ふつう" },
  { value: 3, label: "むずかしい" },
] as const

const MAX_DIMENSION = 1200
const JPEG_QUALITY = 0.78

async function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height))
      const canvas = document.createElement("canvas")
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext("2d")
      if (!ctx) { resolve(file); return }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return }
          const outName = file.name.replace(/\.[^.]+$/, ".jpg") || "photo.jpg"
          resolve(new File([blob], outName, { type: "image/jpeg" }))
        },
        "image/jpeg",
        JPEG_QUALITY
      )
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    img.src = url
  })
}

export default function SubmitForm({ id, rejectedFeedback, requiresPhoto = false }: { id: string; rejectedFeedback?: string | null; requiresPhoto?: boolean }) {
  const [state, dispatch, isPending] = useActionState(submitHomework, { error: "" })
  const [preview, setPreview] = useState<string | null>(null)
  const [difficulty, setDifficulty] = useState<number | null>(null)
  const [isCompressing, setIsCompressing] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const compressedFileRef = useRef<File | null>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) { setPreview(null); compressedFileRef.current = null; return }
    setPreview(URL.createObjectURL(file))
    setIsCompressing(true)
    try {
      compressedFileRef.current = await compressImage(file)
    } finally {
      setIsCompressing(false)
    }
  }

  function handleRemovePhoto() {
    setPreview(null)
    compressedFileRef.current = null
    if (fileRef.current) fileRef.current.value = ""
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    if (compressedFileRef.current) {
      formData.set("photo", compressedFileRef.current)
    }
    startTransition(() => {
      dispatch(formData)
    })
  }

  const isSubmitDisabled = isPending || isCompressing || (requiresPhoto && !preview)

  return (
    <Card>
      <CardHeader>
        <CardTitle>提出する</CardTitle>
        <CardDescription>完了したことを先生に報告します</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <PendingStatus pending={isPending} label="宿題を提出しています" />
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="difficultyRating" value={difficulty ?? ""} />
          {state.error && (
            <FormMessage type="error">{state.error} 写真とコメントを確認してください。</FormMessage>
          )}

          {rejectedFeedback && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
              <p className="text-xs font-medium text-destructive mb-1">先生のコメント（差し戻し理由）</p>
              <p className="text-sm text-destructive/80">{rejectedFeedback}</p>
            </div>
          )}

          <div className="space-y-2">
            <FormFieldLabel htmlFor="homework-photo" label="提出写真" required={requiresPhoto} />
            <p className="text-xs text-muted-foreground">代表的なページを1枚だけ撮影して添付してください</p>
            {preview && (
              <div className="space-y-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="提出写真プレビュー"
                  className="max-h-64 w-full rounded-lg border bg-muted object-contain"
                />
                {isCompressing ? (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <LoaderCircle className="size-3 animate-spin" aria-hidden />
                    写真を圧縮中...
                  </p>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemovePhoto}
                    className="border-destructive/40 text-destructive hover:bg-muted"
                  >
                    <Trash2 aria-hidden />
                    写真を削除
                  </Button>
                )}
              </div>
            )}
            {requiresPhoto && !preview && (
              <p className="text-xs text-destructive">写真を添付してください（提出に必須です）</p>
            )}
            <label className={`flex h-28 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors hover:bg-muted/50 ${requiresPhoto && !preview ? "border-destructive/50" : "border-input"}${preview ? " hidden" : ""}`}>
              <ImagePlus className="mb-1 size-5 text-muted-foreground" aria-hidden />
              <span className="text-sm text-muted-foreground">写真を選択</span>
              <span className="text-xs text-muted-foreground mt-1">カメラで撮影も可能です</span>
              <input
                ref={fileRef}
                id="homework-photo"
                type="file"
                name="photo"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>

          <details className="group rounded-lg border bg-muted/30">
            <summary className="flex min-h-11 cursor-pointer list-none items-center px-3 text-sm font-medium text-muted-foreground hover:text-foreground [&::-webkit-details-marker]:hidden">任意項目（難易度・コメント）</summary>
            <div className="space-y-4 border-t p-3">
          <div className="space-y-2">
            <FormFieldLabel label="この宿題の難易度" />
            <div className="flex gap-2">
              {DIFFICULTIES.map((d) => (
                <button key={d.value} type="button" aria-pressed={difficulty === d.value} onClick={() => setDifficulty(difficulty === d.value ? null : d.value)} className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-lg border-2 text-sm font-medium ${difficulty === d.value ? "border-primary bg-primary text-primary-foreground" : "border-input text-muted-foreground hover:bg-muted"}`}>
                  <DifficultyBars level={d.value} className="h-3 w-5" /><span className="text-xs">{d.label}</span>
                </button>
              ))}
            </div>
          </div>
          <FormField htmlFor="note" label="先生へのコメント" hint="質問や報告がある場合に入力します。">
            <Textarea
              id="note"
              name="note"
              rows={4}
              className="resize-none"
              placeholder="質問や報告があれば入力してください"
            />
          </FormField>
            </div>
          </details>
          {isPending && preview && (
            <div className="flex items-center gap-2.5 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
              <LoaderCircle className="size-4 shrink-0 animate-spin text-primary" aria-hidden />
              <div>
                <p className="text-sm font-medium text-primary">写真をアップロード中...</p>
                <p className="text-xs text-primary/70 mt-0.5">そのままお待ちください</p>
              </div>
            </div>
          )}
          <StickyFormActions>
            <Button type="submit" className="w-full md:w-auto" disabled={isSubmitDisabled}>
              <Send aria-hidden />
              {isPending ? "提出中..." : isCompressing ? "写真を処理中..." : requiresPhoto && !preview ? "写真を添付してください" : "提出する"}
            </Button>
          </StickyFormActions>
        </form>
      </CardContent>
    </Card>
  )
}
