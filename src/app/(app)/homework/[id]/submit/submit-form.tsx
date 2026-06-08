"use client"

import { useActionState, useState, useRef } from "react"
import { submitHomework } from "../actions"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const DIFFICULTIES = [
  { value: 1, label: "かんたん",   emoji: "😊", active: "bg-foreground border-foreground text-background", inactive: "border-input text-muted-foreground hover:bg-muted" },
  { value: 2, label: "ふつう",     emoji: "😐", active: "bg-foreground border-foreground text-background", inactive: "border-input text-muted-foreground hover:bg-muted" },
  { value: 3, label: "むずかしい", emoji: "😰", active: "bg-foreground border-foreground text-background", inactive: "border-input text-muted-foreground hover:bg-muted" },
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
    dispatch(formData)
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
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="difficultyRating" value={difficulty ?? ""} />
          {state.error && (
            <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{state.error}</p>
          )}

          {rejectedFeedback && (
            <div className="rounded-md bg-destructive/5 border border-destructive/20 p-3">
              <p className="text-xs font-medium text-destructive mb-1">先生のコメント（差し戻し理由）</p>
              <p className="text-sm text-destructive/80">{rejectedFeedback}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label>この宿題の難易度（任意）</Label>
            <div className="flex gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDifficulty(difficulty === d.value ? null : d.value)}
                  className={`flex-1 py-2.5 rounded-md text-sm border-2 font-medium transition-colors flex flex-col items-center gap-0.5
                    ${difficulty === d.value ? d.active : d.inactive}`}
                >
                  <span className="text-lg leading-none">{d.emoji}</span>
                  <span className="text-xs">{d.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>提出写真</Label>
              {requiresPhoto ? (
                <span className="text-xs font-medium text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">必須</span>
              ) : (
                <span className="text-xs text-muted-foreground">任意</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">代表的なページを1枚だけ撮影して添付してください</p>
            {preview && (
              <div className="space-y-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="提出写真プレビュー"
                  className="w-full max-h-64 object-contain rounded-md border bg-muted"
                />
                {isCompressing ? (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <svg className="animate-spin h-3 w-3 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    写真を圧縮中...
                  </p>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemovePhoto}
                    className="border-destructive/40 text-destructive hover:bg-destructive/5"
                  >
                    写真を削除
                  </Button>
                )}
              </div>
            )}
            {requiresPhoto && !preview && (
              <p className="text-xs text-destructive">写真を添付してください（提出に必須です）</p>
            )}
            <label className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed ${requiresPhoto && !preview ? "border-destructive/50" : "border-input"} rounded-md cursor-pointer hover:bg-muted/50 transition-colors${preview ? " hidden" : ""}`}>
              <span className="text-sm text-muted-foreground">タップして写真を選択</span>
              <span className="text-xs text-muted-foreground mt-1">カメラで撮影も可能です</span>
              <input
                ref={fileRef}
                type="file"
                name="photo"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">先生へのコメント（任意）</Label>
            <Textarea
              id="note"
              name="note"
              rows={4}
              className="resize-none"
              placeholder="質問や報告があれば入力してください"
            />
          </div>
          {isPending && preview && (
            <div className="flex items-center gap-2.5 rounded-md bg-primary/5 border border-primary/20 px-4 py-3">
              <svg className="animate-spin h-4 w-4 text-primary shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-primary">写真をアップロード中...</p>
                <p className="text-xs text-primary/70 mt-0.5">そのままお待ちください</p>
              </div>
            </div>
          )}
          <Button type="submit" className="w-full" disabled={isSubmitDisabled}>
            {isPending ? "提出中..." : isCompressing ? "写真を処理中..." : requiresPhoto && !preview ? "写真を添付してください" : "提出する"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
