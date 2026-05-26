"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Button, buttonVariants } from "@/components/ui/button"
import { SubjectTagsList } from "./subject-tags"
import { bulkApproveHomework } from "./bulk-actions"

type Homework = {
  id: string
  title: string
  studentNote: string | null
  subjectIds: string[]
  student: { user: { name: string } }
}

export function BulkApproveSection({
  submitted,
  subjectMap,
}: {
  submitted: Homework[]
  subjectMap: Map<string, string>
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()

  function toggleAll() {
    setSelected((prev) =>
      prev.size === submitted.length ? new Set() : new Set(submitted.map((h) => h.id))
    )
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function approve() {
    startTransition(async () => {
      await bulkApproveHomework(Array.from(selected))
      setSelected(new Set())
    })
  }

  const allSelected = selected.size === submitted.length && submitted.length > 0

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="text-sm font-semibold">承認待ち（{submitted.length}件）</h2>
        {selected.size > 0 && (
          <Button size="sm" onClick={approve} disabled={isPending}>
            {isPending ? "処理中..." : `${selected.size}件を一括承認`}
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none w-fit">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            className="accent-primary"
          />
          すべて選択
        </label>

        {submitted.map((h) => (
          <div key={h.id} className="rounded-lg border bg-white p-4 flex items-start gap-3">
            <input
              type="checkbox"
              checked={selected.has(h.id)}
              onChange={() => toggle(h.id)}
              className="mt-1 accent-primary shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium truncate">{h.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{h.student.user.name}</p>
                  <SubjectTagsList ids={h.subjectIds} map={subjectMap} />
                  {h.studentNote && (
                    <p className="text-sm text-gray-600 mt-2 border-l-2 pl-3">{h.studentNote}</p>
                  )}
                </div>
                <Link
                  href={`/homework/${h.id}/review`}
                  className={buttonVariants({ variant: "outline", size: "sm", className: "shrink-0" })}
                >
                  確認する
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
