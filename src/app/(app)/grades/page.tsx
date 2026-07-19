import { redirect } from "next/navigation"
import { getViewingContext } from "@/lib/view-as"
import { db } from "@/lib/db"
import { getStudentByUserId, getSubjectsByTeacherId, buildSubjectMap } from "@/lib/queries"
import { formatDate } from "@/lib/date-utils"
import { SubjectTags } from "@/components/ui/subject-tags"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import GradeChart from "./grade-chart"
import GradeRadar from "./grade-radar"
import { GradeActionsCell } from "./grade-actions-cell"
import { GradeSwipeRow } from "./grade-swipe-row"
import { GradeTypeFilter } from "./grade-type-filter"
import { GradeStudentFilter } from "./grade-student-filter"
import { GradeSubjectFilter } from "./grade-subject-filter"
import { TEST_TYPE_LABELS } from "@/lib/test-types"
import { scorePercentage } from "@/lib/grade-record"
import { EmptyState } from "@/components/ui/empty-state"

function DiffBadge({ diff }: { diff: number | null }) {
  if (diff == null || Math.abs(diff) < 0.5) return null
  const up = diff > 0
  return (
    <span className={`ml-1.5 text-xs font-medium ${up ? "text-primary" : "text-destructive"}`}>
      {up ? "+" : ""}{Math.round(diff)}
    </span>
  )
}

function VsAvg({ score, avgScore }: { score: number | null; avgScore: number | null }) {
  if (score == null || avgScore == null) return <span className="text-muted-foreground">-</span>
  const diff = score - avgScore
  const up = diff >= 0
  return (
    <span className={`text-sm font-medium ${up ? "text-primary" : "text-destructive"}`}>
      {up ? "+" : ""}{diff}点
    </span>
  )
}

type GradeComparable = {
  studentId?: string
  score: number | null
  maxScore: number | null
  deviation: number | null
}

function gradeComparableValue(grade: GradeComparable): number | null {
  return scorePercentage(grade.score, grade.maxScore) ?? grade.deviation
}

function calcGradeDiff(current: GradeComparable, previous: GradeComparable): number | null {
  const cur = gradeComparableValue(current)
  const pre = gradeComparableValue(previous)
  return cur != null && pre != null ? cur - pre : null
}

function previousDiffs<T extends GradeComparable>(grades: T[], keyForGrade?: (grade: T) => string): Array<number | null> {
  const diffs: Array<number | null> = Array.from({ length: grades.length }, () => null)
  const olderByKey = new Map<string, T>()
  for (let i = grades.length - 1; i >= 0; i--) {
    const grade = grades[i]
    const key = keyForGrade?.(grade) ?? "__all__"
    const previous = olderByKey.get(key)
    diffs[i] = previous ? calcGradeDiff(grade, previous) : null
    olderByKey.set(key, grade)
  }
  return diffs
}

type GradeCardData = {
  testName: string
  testType: string
  date: Date
  subjectIds: string[]
  score: number | null
  maxScore: number | null
  avgScore: number | null
  deviation: number | null
  rank: number | null
  totalStudents: number | null
}

/**
 * モバイル用の成績カード本体。ラベル付き項目の羅列をやめ、
 * 主要な数値を大きく1つ、残りは「·」区切りの1行に圧縮する。
 */
function GradeCard({ g, diff, subjectMap, studentName, comment }: {
  g: GradeCardData
  diff: number | null
  subjectMap: Map<string, string>
  studentName?: string
  comment?: string | null
}) {
  const typeLabel = TEST_TYPE_LABELS[g.testType as keyof typeof TEST_TYPE_LABELS] ?? g.testType
  const primary = g.score != null
    ? `${g.score}${g.maxScore != null ? `/${g.maxScore}` : ""}`
    : g.deviation != null ? `偏差値 ${g.deviation}` : null
  const secondary = [
    g.score != null && g.deviation != null ? `偏差値 ${g.deviation}` : null,
    g.rank != null ? `${g.rank}${g.totalStudents != null ? `/${g.totalStudents}` : ""}位` : null,
    g.score != null && g.avgScore != null ? `平均${g.score - g.avgScore >= 0 ? "+" : ""}${g.score - g.avgScore}点` : null,
  ].filter(Boolean).join(" · ")

  return (
    <div className="space-y-1.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate">{g.testName}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {[studentName, typeLabel, formatDate(g.date)].filter(Boolean).join(" · ")}
          </p>
          <SubjectTags ids={g.subjectIds} map={subjectMap} />
        </div>
        {primary && (
          <p className="shrink-0 text-lg font-bold leading-tight tabular-nums">
            {primary}
            <DiffBadge diff={diff} />
          </p>
        )}
      </div>
      {secondary && <p className="text-xs text-muted-foreground">{secondary}</p>}
      {comment && <p className="whitespace-pre-wrap border-l-2 pl-2 text-xs text-muted-foreground">{comment}</p>}
    </div>
  )
}

export default async function GradesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; studentId?: string; subjectId?: string }>
}) {
  const ctx = await getViewingContext()
  if (!ctx) redirect("/login")

  const { type, studentId, subjectId } = await searchParams

  if (ctx.effectiveRole === "teacher") {
    return <TeacherGradesPage teacherId={ctx.effectiveUserId} typeFilter={type} studentIdFilter={studentId} subjectIdFilter={subjectId} />
  }
  if (ctx.effectiveRole === "parent") {
    return <ParentGradesPage parentId={ctx.effectiveUserId} studentIdFilter={studentId} typeFilter={type} />
  }
  return <StudentGradesPage userId={ctx.effectiveUserId} />
}

async function TeacherGradesPage({
  teacherId,
  typeFilter,
  studentIdFilter,
  subjectIdFilter,
}: {
  teacherId: string
  typeFilter?: string
  studentIdFilter?: string
  subjectIdFilter?: string
}) {
  const validTypes = ["mock", "exam", "quiz", "other"] as const
  type ValidType = (typeof validTypes)[number]
  const isValidType = (v: string | undefined): v is ValidType =>
    validTypes.includes(v as ValidType)

  const [grades, subjects, students] = await Promise.all([
    db.gradeRecord.findMany({
      where: {
        teacherId,
        ...(isValidType(typeFilter) ? { testType: typeFilter } : {}),
        ...(studentIdFilter ? { studentId: studentIdFilter } : {}),
        ...(subjectIdFilter ? { subjectIds: { has: subjectIdFilter } } : {}),
      },
      include: { student: { include: { user: { select: { name: true } } } } },
      orderBy: { date: "desc" },
    }),
    getSubjectsByTeacherId(teacherId),
    db.student.findMany({
      where: { teacherId },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ])

  const subjectMap = buildSubjectMap(subjects)

  const prevDiff = previousDiffs(grades, (g) => g.studentId)

  const chartGrades = studentIdFilter ? grades.map((g) => ({
    id: g.id,
    testName: g.testName,
    testType: g.testType,
    date: g.date.toISOString(),
    score: g.score,
    maxScore: g.maxScore,
    avgScore: g.avgScore,
    deviation: g.deviation,
    subjectIds: g.subjectIds,
  })) : []

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center">
          <GradeStudentFilter students={students} />
          <GradeSubjectFilter subjects={subjects} />
          <Link href="/grades/new" className={buttonVariants({ size: "sm", className: "w-full justify-center sm:w-auto sm:shrink-0" })}>
            成績を記録
          </Link>
        </div>
        <GradeTypeFilter />
      </div>

      {studentIdFilter && chartGrades.length > 0 && (
        <>
          <GradeChart grades={chartGrades} subjects={subjects} typeFilter={typeFilter} />
          <GradeRadar grades={chartGrades} subjects={subjects} />
        </>
      )}

      {grades.length === 0 ? (
        <EmptyState
          title="成績記録がありません"
          description={typeFilter ? "別のテスト種別を選ぶと記録が見つかる場合があります。" : "最初のテスト結果を記録しましょう。"}
          action={!typeFilter ? (
            <Link href="/grades/new" className={buttonVariants({ className: "mt-4 inline-flex" })}>
              最初の成績を記録する
            </Link>
          ) : undefined}
        />
      ) : (
        <>
          {/* モバイル: カード表示 */}
          <div className="lg:hidden space-y-2">
            {grades.map((g, i) => (
              <GradeSwipeRow key={g.id} gradeId={g.id}>
                <GradeCard g={g} diff={prevDiff[i]} subjectMap={subjectMap} studentName={g.student.user.name} />
              </GradeSwipeRow>
            ))}
          </div>
          {/* デスクトップ: テーブル表示 */}
          <div className="hidden lg:block rounded-lg border bg-card overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[780px]">
              <thead className="border-b bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">種別</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">テスト名</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">生徒</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">日付</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">得点</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">対平均</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">順位</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">偏差値</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {grades.map((g, i) => (
                  <tr key={g.id} className="hover:bg-muted">
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground">
                        {TEST_TYPE_LABELS[g.testType as keyof typeof TEST_TYPE_LABELS] ?? g.testType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{g.testName}</p>
                      <SubjectTags ids={g.subjectIds} map={subjectMap} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{g.student.user.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(g.date)}</td>
                    <td className="px-4 py-3">
                      {g.score != null ? (g.maxScore != null ? `${g.score}/${g.maxScore}` : g.score) : "-"}
                      <DiffBadge diff={prevDiff[i]} />
                    </td>
                    <td className="px-4 py-3"><VsAvg score={g.score} avgScore={g.avgScore} /></td>
                    <td className="px-4 py-3">
                      {g.rank != null ? (g.totalStudents != null ? `${g.rank}/${g.totalStudents}` : g.rank) : "-"}
                    </td>
                    <td className="px-4 py-3">{g.deviation ?? "-"}</td>
                    <td className="px-4 py-3"><GradeActionsCell gradeId={g.id} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

async function StudentGradesPage({ userId }: { userId: string }) {
  const student = await getStudentByUserId(userId)
  if (!student) redirect("/dashboard")

  const [grades, subjects] = await Promise.all([
    db.gradeRecord.findMany({ where: { studentId: student.id }, orderBy: { date: "desc" } }),
    getSubjectsByTeacherId(student.teacherId),
  ])

  const subjectMap = buildSubjectMap(subjects)

  const chartGrades = grades.map((g) => ({
    id: g.id,
    testName: g.testName,
    testType: g.testType,
    date: g.date.toISOString(),
    score: g.score,
    maxScore: g.maxScore,
    avgScore: g.avgScore,
    deviation: g.deviation,
    subjectIds: g.subjectIds,
  }))

  const prevDiff = previousDiffs(grades)

  return (
    <div className="space-y-3">

      {grades.length === 0 ? (
        <EmptyState title="成績記録がありません" />
      ) : (
        <>
          <GradeChart grades={chartGrades} subjects={subjects} />
          <GradeRadar grades={chartGrades} subjects={subjects} />

          {/* モバイル: カード表示 */}
          <div className="md:hidden space-y-2">
            {grades.map((g, i) => (
              <div key={g.id} className="rounded-lg border bg-card p-4">
                <GradeCard g={g} diff={prevDiff[i]} subjectMap={subjectMap} comment={g.comment} />
              </div>
            ))}
          </div>
          {/* デスクトップ: テーブル表示 */}
          <div className="hidden md:block rounded-lg border bg-card overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="border-b bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">テスト名</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">種別</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">日付</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">得点</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">対平均</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">順位</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">偏差値</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">コメント</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {grades.map((g, i) => (
                  <tr key={g.id} className="hover:bg-muted">
                    <td className="px-4 py-3">
                      <p className="font-medium">{g.testName}</p>
                      <SubjectTags ids={g.subjectIds} map={subjectMap} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground">
                        {TEST_TYPE_LABELS[g.testType as keyof typeof TEST_TYPE_LABELS] ?? g.testType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(g.date)}</td>
                    <td className="px-4 py-3">
                      {g.score != null ? (g.maxScore != null ? `${g.score}/${g.maxScore}` : g.score) : "-"}
                      <DiffBadge diff={prevDiff[i]} />
                    </td>
                    <td className="px-4 py-3"><VsAvg score={g.score} avgScore={g.avgScore} /></td>
                    <td className="px-4 py-3">
                      {g.rank != null ? (g.totalStudents != null ? `${g.rank}/${g.totalStudents}` : g.rank) : "-"}
                    </td>
                    <td className="px-4 py-3">{g.deviation ?? "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{g.comment ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

async function ParentGradesPage({
  parentId,
  studentIdFilter,
  typeFilter,
}: {
  parentId: string
  studentIdFilter?: string
  typeFilter?: string
}) {
  const links = await db.parentStudent.findMany({
    where: { parentId },
    include: { student: { include: { user: { select: { name: true } } } } },
  })
  if (links.length === 0) {
    return (
      <EmptyState title="お子様の情報が登録されていません" description="先生から保護者招待を受け取ってください。" />
    )
  }

  const allowedStudentIds = links.map((l) => l.studentId)
  const effectiveStudentId = studentIdFilter && allowedStudentIds.includes(studentIdFilter)
    ? studentIdFilter
    : allowedStudentIds[0]

  const validTypes = ["mock", "exam", "quiz", "other"] as const
  const isValidType = (v: string | undefined): v is (typeof validTypes)[number] =>
    validTypes.includes(v as (typeof validTypes)[number])

  const grades = await db.gradeRecord.findMany({
    where: {
      studentId: effectiveStudentId,
      ...(isValidType(typeFilter) ? { testType: typeFilter } : {}),
    },
    orderBy: { date: "desc" },
  })

  const teacherId = links.find((l) => l.studentId === effectiveStudentId)?.teacherId
  const subjects = teacherId ? await getSubjectsByTeacherId(teacherId) : []
  const subjectMap = buildSubjectMap(subjects)

  const chartGrades = grades.map((g) => ({
    id: g.id,
    testName: g.testName,
    testType: g.testType,
    date: g.date.toISOString(),
    score: g.score,
    maxScore: g.maxScore,
    avgScore: g.avgScore,
    deviation: g.deviation,
    subjectIds: g.subjectIds,
  }))

  const prevDiff = previousDiffs(grades)

  return (
    <div className="space-y-3">
      {links.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          {links.map(({ student }) => (
            <a
              key={student.id}
              href={`/grades?studentId=${student.id}`}
              className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                student.id === effectiveStudentId
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:bg-muted"
              }`}
            >
              {student.user.name}
            </a>
          ))}
        </div>
      )}

      {grades.length === 0 ? (
        <EmptyState title="成績記録がありません" />
      ) : (
        <>
          <GradeChart grades={chartGrades} subjects={subjects} />
          <GradeRadar grades={chartGrades} subjects={subjects} />
          <div className="md:hidden space-y-2">
            {grades.map((g, i) => (
              <div key={g.id} className="rounded-lg border bg-card p-4">
                <GradeCard g={g} diff={prevDiff[i]} subjectMap={subjectMap} comment={g.comment} />
              </div>
            ))}
          </div>
          <div className="hidden md:block rounded-lg border bg-card overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead className="border-b bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">テスト名</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">種別</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">日付</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">得点</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">偏差値</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">順位</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">コメント</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {grades.map((g, i) => (
                  <tr key={g.id} className="hover:bg-muted">
                    <td className="px-4 py-3">
                      <p className="font-medium">{g.testName}</p>
                      <SubjectTags ids={g.subjectIds} map={subjectMap} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground">
                        {TEST_TYPE_LABELS[g.testType as keyof typeof TEST_TYPE_LABELS] ?? g.testType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(g.date)}</td>
                    <td className="px-4 py-3">
                      {g.score != null ? (g.maxScore != null ? `${g.score}/${g.maxScore}` : g.score) : "-"}
                      <DiffBadge diff={prevDiff[i]} />
                    </td>
                    <td className="px-4 py-3">{g.deviation ?? "-"}</td>
                    <td className="px-4 py-3">{g.rank != null ? (g.totalStudents != null ? `${g.rank}/${g.totalStudents}` : g.rank) : "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{g.comment ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
