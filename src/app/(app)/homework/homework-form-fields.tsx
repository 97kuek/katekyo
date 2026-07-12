"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type Subject = { id: string; name: string }

/**
 * 宿題の作成・編集フォームで共通のコアフィールド（タイトル / 内容 / 期限）。
 * mode="create" では必須マーク・placeholder・autoFocus を表示する。
 */
export function HomeworkCoreFields({
  mode,
  defaults,
}: {
  mode: "create" | "edit"
  defaults?: { title?: string; description?: string; dueDate?: string }
}) {
  const isCreate = mode === "create"
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="title">
          タイトル {isCreate && <span className="text-destructive">*</span>}
        </Label>
        <Input
          id="title"
          name="title"
          required
          defaultValue={defaults?.title}
          placeholder={isCreate ? "例: 英単語50問" : undefined}
          autoFocus={isCreate}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">内容（任意）</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          className="resize-none"
          defaultValue={defaults?.description}
          placeholder={isCreate ? "詳細な指示があれば入力してください" : undefined}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="dueDate">
          期限 {isCreate && <span className="text-destructive">*</span>}
        </Label>
        <Input id="dueDate" name="dueDate" type="date" required defaultValue={defaults?.dueDate} />
      </div>
    </>
  )
}

/** 科目タグのチェックボックス群。subjects が空なら何も表示しない */
export function SubjectCheckboxes({
  label,
  subjects,
  defaultCheckedIds,
}: {
  label: string
  subjects: Subject[]
  defaultCheckedIds?: string[]
}) {
  if (subjects.length === 0) return null
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-3">
        {subjects.map((s) => (
          <label key={s.id} className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              name="subjectIds"
              value={s.id}
              defaultChecked={defaultCheckedIds?.includes(s.id)}
              className="accent-primary"
            />
            <span className="text-sm">{s.name}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
