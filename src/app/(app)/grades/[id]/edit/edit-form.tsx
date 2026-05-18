"use client"

import { useActionState } from "react"
import { updateGradeRecord } from "../edit-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TEST_TYPE_OPTIONS } from "@/lib/test-types"

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

const ratings = [1, 2, 3, 4, 5]

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
        <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{state.error}</p>
      )}
      <p className="text-xs text-muted-foreground"><span className="text-destructive font-medium">*</span> は必須項目です</p>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-2">
          <Label>生徒</Label>
          <Input value={grade.student.user.name} disabled className="bg-gray-50" />
        </div>

        <div className="col-span-2 space-y-2">
          <Label htmlFor="testType">テスト種別 <span className="text-destructive">*</span></Label>
          <select
            id="testType"
            name="testType"
            defaultValue={grade.testType}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {TEST_TYPE_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div className="col-span-2 space-y-2">
          <Label htmlFor="testName">テスト名 <span className="text-destructive">*</span></Label>
          <Input id="testName" name="testName" required defaultValue={grade.testName} />
        </div>

        <div className="col-span-2 space-y-2">
          <Label htmlFor="date">実施日 <span className="text-destructive">*</span></Label>
          <Input
            id="date"
            name="date"
            type="date"
            required
            defaultValue={grade.date.toISOString().split("T")[0]}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="score">得点 <span className="text-xs text-muted-foreground font-normal">（任意）</span></Label>
          <Input id="score" name="score" type="number" min="0" defaultValue={grade.score ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxScore">満点 <span className="text-xs text-muted-foreground font-normal">（任意）</span></Label>
          <Input id="maxScore" name="maxScore" type="number" min="1" defaultValue={grade.maxScore ?? ""} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="rank">順位 <span className="text-xs text-muted-foreground font-normal">（任意）</span></Label>
          <Input id="rank" name="rank" type="number" min="1" defaultValue={grade.rank ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="totalStudents">受験者数 <span className="text-xs text-muted-foreground font-normal">（任意）</span></Label>
          <Input id="totalStudents" name="totalStudents" type="number" min="1" defaultValue={grade.totalStudents ?? ""} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="deviation">偏差値 <span className="text-xs text-muted-foreground font-normal">（任意）</span></Label>
          <Input
            id="deviation"
            name="deviation"
            type="number"
            step="0.1"
            min="0"
            max="100"
            defaultValue={grade.deviation ?? ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="avgScore">クラス平均点 <span className="text-xs text-muted-foreground font-normal">（任意）</span></Label>
          <Input
            id="avgScore"
            name="avgScore"
            type="number"
            min="0"
            defaultValue={grade.avgScore ?? ""}
          />
        </div>

        <div className="space-y-2">
          <Label>主観評価 <span className="text-xs text-muted-foreground font-normal">（任意）</span></Label>
          <div className="flex gap-2 pt-1">
            {ratings.map((r) => (
              <label key={r} className="flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="teacherRating"
                  value={r}
                  defaultChecked={grade.teacherRating === r}
                  className="accent-primary"
                />
                <span className="text-sm">{r}</span>
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
                <input
                  type="checkbox"
                  name="subjectIds"
                  value={s.id}
                  defaultChecked={grade.subjectIds.includes(s.id)}
                  className="accent-primary"
                />
                <span className="text-sm">{s.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="comment">コメント <span className="text-xs text-muted-foreground font-normal">（任意）</span></Label>
        <textarea
          id="comment"
          name="comment"
          rows={3}
          defaultValue={grade.comment ?? ""}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
        />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "保存中..." : "変更を保存"}
      </Button>
    </form>
  )
}
