import type { ChangeEventHandler, ReactNode } from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { TEST_TYPE_OPTIONS } from "@/lib/test-types"
import { FormField } from "@/components/ui/form-field"

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

        <FormField htmlFor="testType" label="テスト種別" required className="col-span-2 space-y-2" hint="模試は偏差値、それ以外は得点率を学習の森の評価に優先利用します。">
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
        </FormField>

        <FormField htmlFor="testName" label="テスト名" required className="col-span-2 space-y-2" hint="一覧で他の記録と区別できる正式名称を入力します。" example="2026年 第1回 英語模試">
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
        </FormField>

        <FormField htmlFor="date" label="実施日" required className="col-span-2 space-y-2">
          <Input
            id="date"
            name="date"
            type="date"
            required
            {...(dateValue !== undefined
              ? { value: dateValue, onChange: onDateChange }
              : { defaultValue: defaultValues.date })}
          />
        </FormField>

        <FormField htmlFor="score" label="得点" hint="半角数字で入力します。カンマ・単位・ハイフンは不要です。" example="82">
          {mode === "create" ? (
            <Input id="score" name="score" type="number" inputMode="numeric" min="0" max="10000" placeholder="82" />
          ) : (
            <Input id="score" name="score" type="number" min="0" max="10000" defaultValue={defaultValues.score} />
          )}
        </FormField>
        <FormField htmlFor="maxScore" label="満点" hint="得点を入力した場合は必ずセットで入力します。" example="100">
          {mode === "create" ? (
            <Input id="maxScore" name="maxScore" type="number" inputMode="numeric" min="1" max="10000" placeholder="100" />
          ) : (
            <Input id="maxScore" name="maxScore" type="number" min="1" max="10000" defaultValue={defaultValues.maxScore} />
          )}
        </FormField>

        <FormField htmlFor="rank" label="順位" hint="半角数字のみ。受験者数とセットで入力します。" example="15">
          {mode === "create" ? (
            <Input id="rank" name="rank" type="number" inputMode="numeric" min="1" max="1000000" placeholder="15" />
          ) : (
            <Input id="rank" name="rank" type="number" min="1" max="1000000" defaultValue={defaultValues.rank} />
          )}
        </FormField>
        <FormField htmlFor="totalStudents" label="受験者数" hint="順位を入力した場合は必ずセットで入力します。" example="200">
          {mode === "create" ? (
            <Input id="totalStudents" name="totalStudents" type="number" inputMode="numeric" min="1" max="1000000" placeholder="200" />
          ) : (
            <Input id="totalStudents" name="totalStudents" type="number" min="1" max="1000000" defaultValue={defaultValues.totalStudents} />
          )}
        </FormField>

        <FormField htmlFor="deviation" label="偏差値" hint="半角数字で、小数第1位まで入力できます。" example="58.5">
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
        </FormField>

        <FormField htmlFor="avgScore" label="クラス平均点" hint="満点と同じ単位の半角数字で入力します。" example="65">
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
        </FormField>

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
              <label key={s.id} className="flex min-h-11 items-center gap-1.5 cursor-pointer">
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

      <FormField htmlFor="comment" label="コメント" hint="生徒が次に取り組むことを具体的に書くと、結果を行動につなげやすくなります。" example="長文問題の根拠箇所に線を引いて復習しましょう">
        <Textarea
          id="comment"
          name="comment"
          rows={3}
          maxLength={2000}
          defaultValue={defaultValues.comment}
          className="resize-none"
          placeholder={commentPlaceholder}
        />
      </FormField>
    </>
  )
}
