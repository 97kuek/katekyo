"use client"

import { useActionState } from "react"
import { updateGradeRecord } from "../actions"
import { GradeFormFields } from "../../grade-form-fields"
import { Button } from "@/components/ui/button"
import { StickyFormActions } from "@/components/ui/sticky-form-actions"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormMessage } from "@/components/ui/form-message"

type Grade = {
  id: string
  testName: string
  testType: string
  date: Date
  subjectIds: string[]
  score: number | null
  maxScore: number | null
  avgScore: number | null
  rank: number | null
  totalStudents: number | null
  deviation: number | null
  teacherRating: number | null
  comment: string | null
  student: { user: { name: string } }
}
type Subject = { id: string; name: string }


export default function EditGradeForm({
  grade,
  subjects,
}: {
  grade: Grade
  subjects: Subject[]
}) {
  const [state, action, isPending] = useActionState(updateGradeRecord, { error: "" })

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="id" value={grade.id} />
      {state.error && (
        <FormMessage type="error">{state.error}</FormMessage>
      )}
      <p className="text-xs text-muted-foreground"><span className="text-destructive font-medium">*</span> は必須項目です</p>

      <GradeFormFields
        subjects={subjects}
        defaultValues={{
          testType: grade.testType,
          testName: grade.testName,
          date: grade.date.toISOString().split("T")[0],
          score: grade.score ?? "",
          maxScore: grade.maxScore ?? "",
          rank: grade.rank ?? "",
          totalStudents: grade.totalStudents ?? "",
          deviation: grade.deviation ?? "",
          avgScore: grade.avgScore ?? "",
          subjectIds: grade.subjectIds,
          comment: grade.comment ?? "",
        }}
        mode="edit"
        studentField={(
          <div className="col-span-2 space-y-2">
            <Label>生徒</Label>
            <Input value={grade.student.user.name} disabled className="bg-muted" />
          </div>
        )}
      />

      <StickyFormActions>
        <Button type="submit" className="w-full md:w-auto" disabled={isPending}>
          {isPending ? "保存中..." : "変更を保存"}
        </Button>
      </StickyFormActions>
    </form>
  )
}
