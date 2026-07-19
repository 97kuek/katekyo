"use client"

import { Plus } from "lucide-react"
import CreateGradeForm from "./new/create-form"
import { Sheet } from "@/components/ui/sheet"
import { buttonVariants } from "@/components/ui/button"

type Student = { id: string; grade: string; user: { name: string } }
type Subject = { id: string; name: string }
type ExamEvent = { id: string; name: string; testType: string; date: string; studentId: string; studentName: string }

export function GradeCreateSheet({
  students,
  subjects,
  examEvents,
  defaultStudentId,
  compact = false,
}: {
  students: Student[]
  subjects: Subject[]
  examEvents: ExamEvent[]
  defaultStudentId?: string
  compact?: boolean
}) {
  return (
    <Sheet
      trigger={compact ? <Plus aria-hidden /> : <><Plus aria-hidden />成績を記録</>}
      triggerLabel="成績を記録"
      triggerClassName={buttonVariants({
        variant: compact ? "secondary" : "default",
        size: compact ? "icon-sm" : "default",
      })}
      title="成績を記録"
      description="一覧を離れずに、テスト結果とフィードバックを追加できます。"
    >
      <CreateGradeForm
        students={students}
        subjects={subjects}
        examEvents={examEvents}
        defaultStudentId={defaultStudentId}
        withinSheet
      />
    </Sheet>
  )
}
