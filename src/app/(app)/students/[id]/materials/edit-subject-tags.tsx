"use client"

import { useState, useTransition } from "react"
import { updateMaterialSubjects } from "./actions"
import { Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"

type Subject = { id: string; name: string }

export function EditSubjectTags({
  materialId,
  studentId,
  currentSubjectIds,
  subjects,
}: {
  materialId: string
  studentId: string
  currentSubjectIds: string[]
  subjects: Subject[]
}) {
  const [editing, setEditing] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set(currentSubjectIds))
  const [isPending, startTransition] = useTransition()

  if (subjects.length === 0) return null

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function save() {
    startTransition(async () => {
      await updateMaterialSubjects(materialId, studentId, [...selected])
      setEditing(false)
    })
  }

  function cancel() {
    setSelected(new Set(currentSubjectIds))
    setEditing(false)
  }

  if (!editing) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={() => setEditing(true)}
        title="科目タグを編集"
        aria-label="科目タグを編集"
      >
        <Pencil className="h-3.5 w-3.5" />
      </Button>
    )
  }

  return (
    <div className="mt-1.5 space-y-1.5">
      <div className="flex flex-wrap gap-2">
        {subjects.map((s) => (
          <label key={s.id} className="inline-flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={selected.has(s.id)}
              onChange={() => toggle(s.id)}
              className="accent-primary"
            />
            <span className="text-xs">{s.name}</span>
          </label>
        ))}
      </div>
      <div className="flex gap-3">
        <Button
          type="button"
          size="xs"
          onClick={save}
          disabled={isPending}
        >
          {isPending ? "保存中..." : "保存"}
        </Button>
        <Button type="button" variant="outline" size="xs" onClick={cancel}>
          キャンセル
        </Button>
      </div>
    </div>
  )
}
