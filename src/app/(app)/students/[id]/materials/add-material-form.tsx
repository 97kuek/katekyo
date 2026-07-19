"use client"

import { useActionState, useRef } from "react"
import { createMaterial } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FormField, FormFieldLabel } from "@/components/ui/form-field"
import { FormMessage } from "@/components/ui/form-message"
import { PendingStatus } from "@/components/ui/pending-status"
import { toast } from "sonner"
import { ChoiceControl } from "@/components/ui/choice-control"

type Subject = { id: string; name: string }

export function AddMaterialForm({ studentId, subjects }: { studentId: string; subjects: Subject[] }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [state, action, isPending] = useActionState(
    async (previous: { error: string }, formData: FormData) => {
      const result = await createMaterial(previous, formData)
      if (!result.error) {
        formRef.current?.reset()
        toast.success("教材を追加しました。宿題作成時に選択できます")
      }
      return result
    },
    { error: "" }
  )

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <PendingStatus pending={isPending} label="教材を追加しています" />
      <input type="hidden" name="studentId" value={studentId} />
      {state.error && <FormMessage type="error">{state.error} 教材名を確認して、もう一度追加してください。</FormMessage>}
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField htmlFor="material-name" label="教材名" required hint="表紙に記載された名前を入力します。" example="チャート式数学">
          <Input id="material-name" name="name" required maxLength={100} placeholder="チャート式数学" />
        </FormField>
        <FormField htmlFor="material-note" label="メモ" hint="版、学年、用途など、同名教材を区別する情報を入力します。" example="青・高校2年">
          <Input id="material-note" name="note" maxLength={200} placeholder="版や用途を入力" />
        </FormField>
      </div>
      {subjects.length > 0 && (
        <div className="space-y-1.5">
          <FormFieldLabel label="科目タグ（複数選択可）" />
          <div className="flex flex-wrap gap-2">
            {subjects.map((s) => (
              <ChoiceControl key={s.id} type="checkbox" name="subjectIds" value={s.id} label={s.name} />
            ))}
          </div>
        </div>
      )}
      <Button type="submit" disabled={isPending} size="sm" className="h-10 sm:h-8">
        {isPending ? "追加中..." : "追加"}
      </Button>
    </form>
  )
}
