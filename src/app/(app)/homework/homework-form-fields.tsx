"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { FormField, FormFieldLabel } from "@/components/ui/form-field"
import { ChoiceControl } from "@/components/ui/choice-control"

type Subject = { id: string; name: string }

/**
 * 宿題の作成・編集フォームで共通のコアフィールド（タイトル / 内容 / 期限）。
 * mode="create" では必須マーク・placeholder・autoFocus を表示する。
 */
export function HomeworkCoreFields({
  mode,
  defaults,
  includeDescription = true,
}: {
  mode: "create" | "edit"
  defaults?: { title?: string; description?: string; dueDate?: string }
  includeDescription?: boolean
}) {
  const isCreate = mode === "create"
  return (
    <>
      <FormField htmlFor="title" label="タイトル" required hint="生徒が一覧を見ただけで内容を判断できる短い名前にします。" example="英単語50問">
        <Input
          id="title"
          name="title"
          required
          defaultValue={defaults?.title}
          placeholder={isCreate ? "例: 英単語50問" : undefined}
          autoFocus={isCreate}
          maxLength={100}
        />
      </FormField>
      {includeDescription && <HomeworkDescriptionField mode={mode} defaultValue={defaults?.description} />}
      <FormField htmlFor="dueDate" label="期限" required hint="生徒の端末では日付選択として表示されます。">
        <Input id="dueDate" name="dueDate" type="date" required defaultValue={defaults?.dueDate} />
      </FormField>
    </>
  )
}

export function HomeworkDescriptionField({
  mode,
  defaultValue,
}: {
  mode: "create" | "edit"
  defaultValue?: string
}) {
  return (
    <FormField htmlFor="description" label="内容" hint="ページ範囲、提出方法、注意事項など、タイトルだけでは分からない指示を入力します。" example="教科書p.30〜35。途中式もノートに残してください">
      <Textarea
        id="description"
        name="description"
        rows={3}
        className="resize-none"
        defaultValue={defaultValue}
        placeholder={mode === "create" ? "ページ範囲や注意事項を入力" : undefined}
      />
    </FormField>
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
      <FormFieldLabel label={label} />
      <div className="flex flex-wrap gap-2">
        {subjects.map((s) => (
          <ChoiceControl
            key={s.id}
            type="checkbox"
            name="subjectIds"
            value={s.id}
            defaultChecked={defaultCheckedIds?.includes(s.id)}
            label={s.name}
          />
        ))}
      </div>
    </div>
  )
}
