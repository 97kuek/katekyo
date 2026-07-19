import type { ChangeEventHandler, ReactNode } from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { TEST_TYPE_OPTIONS } from "@/lib/test-types"

type Subject = { id: string; name: string }

type GradeFormDefaultValues = {
  testType?: string
  testName?: string
  date?: string
  score?: string | number
  maxScore?: string | number
  rank?: string | number
  totalStudents?: string | number
  deviation?: string | number
  avgScore?: string | number
  subjectIds?: string[]
  comment?: string
}

type GradeFormFieldsProps = {
  subjects: Subject[]
  defaultValues: GradeFormDefaultValues
  mode: "create" | "edit"
  studentField: ReactNode
  testTypeValue?: string
  onTestTypeChange?: ChangeEventHandler<HTMLSelectElement>
  testNameValue?: string
  onTestNameChange?: ChangeEventHandler<HTMLInputElement>
  dateValue?: string
  onDateChange?: ChangeEventHandler<HTMLInputElement>
  testNamePlaceholder?: string
  testNameAutoFocus?: boolean
  commentPlaceholder?: string
}

export function GradeFormFields({
  subjects,
  defaultValues,
  mode,
  studentField,
  testTypeValue,
  onTestTypeChange,
  testNameValue,
  onTestNameChange,
  dateValue,
  onDateChange,
  testNamePlaceholder,
  testNameAutoFocus,
  commentPlaceholder,
}: GradeFormFieldsProps) {
  const selectedSubjectIds = defaultValues.subjectIds ?? []

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {studentField}

        <div className="col-span-2 space-y-2">
          <Label htmlFor="testType">テスト種別 <span className="text-destructive">*</span></Label>
          <Select
            id="testType"
            name="testType"
            required={mode === "create" ? true : undefined}
            {...(testTypeValue !== undefined
              ? { value: testTypeValue, onChange: onTestTypeChange }
              : { defaultValue: defaultValues.testType })}
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
            placeholder={testNamePlaceholder}
            autoFocus={testNameAutoFocus}
            {...(testNameValue !== undefined
              ? { value: testNameValue, onChange: onTestNameChange }
              : { defaultValue: defaultValues.testName })}
          />
        </div>

        <div className="col-span-2 space-y-2">
          <Label htmlFor="date">実施日 <span className="text-destructive">*</span></Label>
          <Input
            id="date"
            name="date"
            type="date"
            required
            {...(dateValue !== undefined
              ? { value: dateValue, onChange: onDateChange }
              : { defaultValue: defaultValues.date })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="score">得点 <span className="text-xs text-muted-foreground font-normal">（任意）</span></Label>
          {mode === "create" ? (
            <Input id="score" name="score" type="number" inputMode="numeric" min="0" max="10000" placeholder="82" />
          ) : (
            <Input id="score" name="score" type="number" min="0" max="10000" defaultValue={defaultValues.score} />
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxScore">満点 <span className="text-xs text-muted-foreground font-normal">（任意）</span></Label>
          {mode === "create" ? (
            <Input id="maxScore" name="maxScore" type="number" inputMode="numeric" min="1" max="10000" placeholder="100" />
          ) : (
            <Input id="maxScore" name="maxScore" type="number" min="1" max="10000" defaultValue={defaultValues.maxScore} />
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="rank">順位 <span className="text-xs text-muted-foreground font-normal">（任意）</span></Label>
          {mode === "create" ? (
            <Input id="rank" name="rank" type="number" inputMode="numeric" min="1" max="1000000" placeholder="15" />
          ) : (
            <Input id="rank" name="rank" type="number" min="1" max="1000000" defaultValue={defaultValues.rank} />
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="totalStudents">受験者数 <span className="text-xs text-muted-foreground font-normal">（任意）</span></Label>
          {mode === "create" ? (
            <Input id="totalStudents" name="totalStudents" type="number" inputMode="numeric" min="1" max="1000000" placeholder="200" />
          ) : (
            <Input id="totalStudents" name="totalStudents" type="number" min="1" max="1000000" defaultValue={defaultValues.totalStudents} />
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="deviation">偏差値 <span className="text-xs text-muted-foreground font-normal">（任意）</span></Label>
          {mode === "create" ? (
            <Input id="deviation" name="deviation" type="number" inputMode="decimal" step="0.1" min="0" max="100" placeholder="58.5" />
          ) : (
            <Input
              id="deviation"
              name="deviation"
              type="number"
              step="0.1"
              min="0"
              max="100"
              defaultValue={defaultValues.deviation}
            />
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="avgScore">クラス平均点 <span className="text-xs text-muted-foreground font-normal">（任意）</span></Label>
          {mode === "create" ? (
            <Input id="avgScore" name="avgScore" type="number" inputMode="numeric" min="0" max="10000" placeholder="65" />
          ) : (
            <Input
              id="avgScore"
              name="avgScore"
              type="number"
              min="0"
              max="10000"
              defaultValue={defaultValues.avgScore}
            />
          )}
        </div>

      </div>

      <p className="rounded-lg border border-primary/20 bg-primary/10 p-3 text-xs leading-relaxed text-foreground">
        学習の森は、模試では偏差値を、それ以外では得点率を優先して評価します。優先値がない場合はもう一方を使います。
        得点と満点、順位と受験者数はそれぞれセットで入力してください。
      </p>

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
                  defaultChecked={selectedSubjectIds.includes(s.id)}
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
        <Textarea
          id="comment"
          name="comment"
          rows={3}
          maxLength={2000}
          defaultValue={defaultValues.comment}
          className="resize-none"
          placeholder={commentPlaceholder}
        />
      </div>
    </>
  )
}
