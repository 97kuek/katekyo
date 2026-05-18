"use client"

import { useActionState } from "react"
import { createGradeRecord } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TEST_TYPE_OPTIONS } from "@/lib/test-types"

type Student = { id: string; grade: string; user: { name: string } }
type Subject = { id: string; name: string }

const ratings = [1, 2, 3, 4, 5]

const todayISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export default function CreateGradeForm({
  students,
  subjects,
}: {
  students: Student[]
  subjects: Subject[]
}) {
  const [state, action, isPending] = useActionState(createGradeRecord, { error: "" })
  const singleStudent = students.length === 1 ? students[0] : null

  return (
    <form action={action} className="space-y-5">
      {state.error && (
        <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{state.error}</p>
      )}
      <p className="text-xs text-muted-foreground"><span className="text-destructive font-medium">*</span> は必須項目です</p>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-2">
          <Label htmlFor="studentId">生徒 <span className="text-destructive">*</span></Label>
          {singleStudent ? (
            <>
              <input type="hidden" name="studentId" value={singleStudent.id} />
              <p className="text-sm py-2 px-3 rounded-md border bg-gray-50">{singleStudent.user.name}（{singleStudent.grade}）</p>
            </>
          ) : (
            <select
              id="studentId"
              name="studentId"
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">生徒を選択してください</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.user.name}（{s.grade}）</option>
              ))}
            </select>
          )}
        </div>

        <div className="col-span-2 space-y-2">
          <Label htmlFor="testType">テスト種別 <span className="text-destructive">*</span></Label>
          <select
            id="testType"
            name="testType"
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {TEST_TYPE_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div className="col-span-2 space-y-2">
          <Label htmlFor="testName">テスト名 <span className="text-destructive">*</span></Label>
          <Input id="testName" name="testName" required placeholder="例: 2024年 第1回 英語模試" autoFocus />
        </div>

        <div className="col-span-2 space-y-2">
          <Label htmlFor="date">実施日 <span className="text-destructive">*</span></Label>
          <Input id="date" name="date" type="date" required defaultValue={todayISO()} />
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
        <textarea
          id="comment"
          name="comment"
          rows={3}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          placeholder="生徒へのフィードバックを入力してください"
        />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "保存中..." : "成績を記録する"}
      </Button>
    </form>
  )
}
