"use client"

import { useActionState, useEffect, useRef } from "react"
import { createSubject } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SubjectForm() {
  const [state, action, isPending] = useActionState(createSubject, { error: "", success: false })
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset()
    }
  }, [state.success])

  return (
    <form ref={formRef} action={action} className="flex gap-2 items-end">
      <div className="flex-1 space-y-2">
        <Label htmlFor="name">新しい科目タグ</Label>
        {state.error && (
          <p className="text-xs text-red-600">{state.error}</p>
        )}
        <Input
          id="name"
          name="name"
          placeholder="例: 数学、英語、国語"
          required
          maxLength={50}
        />
      </div>
      <Button type="submit" disabled={isPending} className="shrink-0">
        {isPending ? "追加中..." : "追加"}
      </Button>
    </form>
  )
}
