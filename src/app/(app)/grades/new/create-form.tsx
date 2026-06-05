"use client"

import { useActionState, useState } from "react"
import { createGradeRecord } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { TEST_TYPE_OPTIONS } from "@/lib/test-types"

type Student = { id: string; grade: string; user: { name: string } }
type Subject = { id: string; name: string }
type ExamEvent = { id: string; name: string; testType: string; date: string; studentId: string; studentName: string }

const ratings = [1, 2, 3, 4, 5]

const todayISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}


export default function CreateGradeForm({
  students,
  subjects,
  examEvents = [],
}: {
  students: Student[]
  subjects: Subject[]
  examEvents?: ExamEvent[]
}) {
  const [state, action, isPending] = useActionState(createGradeRecord, { error: "" })
  const singleStudent = students.length === 1 ? students[0] : null

  const [testName, setTestName] = useState("")
  const [date, setDate] = useState(todayISO())
  const [testType, setTestType] = useState<string>(TEST_TYPE_OPTIONS[0][0])
  const [studentId, setStudentId] = useState(singleStudent?.id ?? "")

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
        <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{state.error}</p>
      )}

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

      <p className="text-xs text-muted-foreground"><span className="text-destructive font-medium">*</span> は必須項目です</p>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-2">
          <Label htmlFor="studentId">生徒 <span className="text-destructive">*</span></Label>
          {singleStudent ? (
            <>
              <input type="hidden" name="studentId" value={singleStudent.id} />
              <p className="text-sm py-2 px-3 rounded-md border bg-muted">{singleStudent.user.name}（{singleStudent.grade}）</p>
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
        </div>

        <div className="col-span-2 space-y-2">
          <Label htmlFor="testType">テスト種別 <span className="text-destructive">*</span></Label>
          <Select
            id="testType"
            name="testType"
            required
            value={testType}
            onChange={(e) => setTestType(e.target.value)}
          >
            {TEST_TYPE_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
        </div>

        <div className="col-span-2 space-y-2">
          <Label htmlFor="testName">テスト名 <span className="text-destructive">*</span></Label>
          <Input
            id="testName"
            name="testName"
            required
            placeholder="例: 2024年 第1回 英語模試"
            autoFocus
            value={testName}
            onChange={(e) => setTestName(e.target.value)}
          />
        </div>

        <div className="col-span-2 space-y-2">
          <Label htmlFor="date">実施日 <span className="text-destructive">*</span></Label>
          <Input
            id="date"
            name="date"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="score">得点 <span className="text-xs text-muted-foreground font-normal">（任意）</span></Label>
          <Input id="score" name="score" type="number" inputMode="numeric" min="0" placeholder="82" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxScore">満点 <span className="text-xs text-muted-foreground font-normal">（任意）</span></Label>
          <Input id="maxScore" name="maxScore" type="number" inputMode="numeric" min="1" placeholder="100" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="rank">順位 <span className="text-xs text-muted-foreground font-normal">（任意）</span></Label>
          <Input id="rank" name="rank" type="number" inputMode="numeric" min="1" placeholder="15" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="totalStudents">受験者数 <span className="text-xs text-muted-foreground font-normal">（任意）</span></Label>
          <Input id="totalStudents" name="totalStudents" type="number" inputMode="numeric" min="1" placeholder="200" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="deviation">偏差値 <span className="text-xs text-muted-foreground font-normal">（任意）</span></Label>
          <Input id="deviation" name="deviation" type="number" inputMode="decimal" step="0.1" min="0" max="100" placeholder="58.5" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="avgScore">クラス平均点 <span className="text-xs text-muted-foreground font-normal">（任意）</span></Label>
          <Input id="avgScore" name="avgScore" type="number" inputMode="numeric" min="0" placeholder="65" />
        </div>

        <div className="space-y-2">
          <Label>主観評価 <span className="text-xs text-muted-foreground font-normal">（任意）</span></Label>
          <div className="flex gap-3 pt-1">
            {ratings.map((r) => (
              <label key={r} className="flex items-center gap-1 cursor-pointer">
                <input type="radio" name="teacherRating" value={r} className="accent-primary" />
                <span className="text-sm">{"★".repeat(r)}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {subjects.length > 0 && (
        <div className="space-y-2">
          <Label>科目タグ <span className="text-xs text-muted-foreground font-normal">（任意・複数選択可）</span></Label>
          <div className="flex flex-wrap gap-3">
            {subjects.map((s) => (
              <label key={s.id} className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" name="subjectIds" value={s.id} className="accent-primary" />
                <span className="text-sm">{s.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="comment">コメント <span className="text-xs text-muted-foreground font-normal">（任意）</span></Label>
        <Textarea
          id="comment"
          name="comment"
          rows={3}
          className="resize-none"
          placeholder="生徒へのフィードバックを入力してください"
        />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "保存中..." : "成績を記録する"}
      </Button>
    </form>
  )
}
