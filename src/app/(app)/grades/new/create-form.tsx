"use client"

import { useActionState, useState } from "react"
import { createGradeRecord } from "./actions"
import { GradeFormFields } from "../grade-form-fields"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StickyFormActions } from "@/components/ui/sticky-form-actions"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { TEST_TYPE_OPTIONS } from "@/lib/test-types"
import { FormMessage } from "@/components/ui/form-message"
import { FormField } from "@/components/ui/form-field"
import { FormProgress } from "@/components/ui/form-progress"
import { PendingStatus } from "@/components/ui/pending-status"
import { BarChart3 } from "lucide-react"

type Student = { id: string; grade: string; user: { name: string } }
type Subject = { id: string; name: string }
type ExamEvent = { id: string; name: string; testType: string; date: string; studentId: string; studentName: string }


const todayISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}


export default function CreateGradeForm({
  students,
  subjects,
  examEvents = [],
  defaultStudentId,
  withinSheet = false,
}: {
  students: Student[]
  subjects: Subject[]
  examEvents?: ExamEvent[]
  defaultStudentId?: string
  withinSheet?: boolean
}) {
  const [state, action, isPending] = useActionState(createGradeRecord, { error: "" })
  const singleStudent = students.length === 1 ? students[0] : null

  const [testName, setTestName] = useState("")
  const [date, setDate] = useState(todayISO())
  const [testType, setTestType] = useState<string>(TEST_TYPE_OPTIONS[0][0])
  const validDefaultStudentId = students.some((student) => student.id === defaultStudentId) ? defaultStudentId : undefined
  const [studentId, setStudentId] = useState(singleStudent?.id ?? validDefaultStudentId ?? "")

  function applyExamEvent(eventId: string) {
    const ev = examEvents.find((e) => e.id === eventId)
    if (!ev) return
    setTestName(ev.name)
    setDate(ev.date)
    setTestType(ev.testType)
    setStudentId(ev.studentId)
  }

  return (
    <form action={action} className="space-y-5">
      {state.error && (
        <FormMessage type="error">{state.error} 関連する項目をセットで確認して、もう一度保存してください。</FormMessage>
      )}
      <FormProgress />
      <PendingStatus pending={isPending} label="成績を記録しています" />

      {examEvents.length > 0 && (
        <div className="space-y-2">
          <Label>試験予定から入力</Label>
          <Select
            defaultValue=""
            onChange={(e) => applyExamEvent(e.target.value)}
          >
            <option value="">選択すると自動入力されます</option>
            {examEvents.map((e) => (
              <option key={e.id} value={e.id}>
                {e.date} — {e.name}（{e.studentName}）
              </option>
            ))}
          </Select>
        </div>
      )}

      <GradeFormFields
        subjects={subjects}
        defaultValues={{ testType, testName, date }}
        mode="create"
        studentField={(
          <FormField htmlFor="studentId" label="生徒" required className="min-w-0 max-w-full space-y-2 sm:col-span-2" hint="成績を記録する生徒を選びます。">
            {singleStudent ? (
              <>
                <input type="hidden" name="studentId" value={singleStudent.id} />
                <Input id="studentId" value={`${singleStudent.user.name}（${singleStudent.grade}）`} disabled />
              </>
            ) : (
              <Select
                id="studentId"
                name="studentId"
                required
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
              >
                <option value="">生徒を選択してください</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.user.name}（{s.grade}）</option>
                ))}
              </Select>
            )}
          </FormField>
        )}
        testTypeValue={testType}
        onTestTypeChange={(e) => setTestType(e.target.value)}
        testNameValue={testName}
        onTestNameChange={(e) => setTestName(e.target.value)}
        dateValue={date}
        onDateChange={(e) => setDate(e.target.value)}
        testNamePlaceholder="例: 2024年 第1回 英語模試"
        testNameAutoFocus
        commentPlaceholder="生徒へのフィードバックを入力してください"
      />

      <StickyFormActions contained={withinSheet}>
        <Button type="submit" className="w-full md:w-auto" disabled={isPending}>
          <BarChart3 aria-hidden />
          {isPending ? "記録中..." : "記録"}
        </Button>
      </StickyFormActions>
    </form>
  )
}
