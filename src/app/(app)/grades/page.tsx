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
import { GradeTypeFilter } from "./grade-type-filter"
import { GradeStudentFilter } from "./grade-student-filter"
import { GradeSubjectFilter } from "./grade-subject-filter"
import { TEST_TYPE_LABELS } from "@/lib/test-types"
import { scorePercentage } from "@/lib/grade-record"
import { EmptyState } from "@/components/ui/empty-state"
import { PageHeader } from "@/components/ui/page-header"
import { Disclosure } from "@/components/ui/disclosure"
import { ParentStudentSwitcher } from "@/components/parent-student-switcher"
import { resolveParentStudentId } from "@/lib/parent-student-context"
import { cacheLife, cacheTag } from "next/cache"
import { cacheProfiles } from "@/lib/cache-policy"
import { cacheTags } from "@/lib/cache-tags"
import { PaginationNav } from "@/components/ui/pagination-nav"
import { GradeCreateSheet } from "./grade-create-sheet"

const GRADE_PAGE_SIZE = 50

function DiffBadge({ diff }: { diff: number | null }) {
  if (diff == null || Math.abs(diff) < 0.5) return null
  const up = diff > 0
  return (
    <span className={`ml-1.5 text-xs font-medium ${up ? "text-primary" : "text-destructive"}`}>
      {up ? "+" : ""}{Math.round(diff)}
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
  searchParams: Promise<{ type?: string; studentId?: string; subjectId?: string; mode?: string; page?: string }>
}) {
  const ctx = await getViewingContext()
  if (!ctx) redirect("/login")

  const { type, studentId, subjectId, mode, page: pageParam } = await searchParams
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1)

  if (ctx.effectiveRole === "teacher") {
    return <TeacherGradesPage teacherId={ctx.effectiveUserId} typeFilter={type} studentIdFilter={studentId} subjectIdFilter={subjectId} mode={mode} page={page} />
  }
  if (ctx.effectiveRole === "parent") {
    return <ParentGradesPage parentId={ctx.effectiveUserId} studentIdFilter={studentId} typeFilter={type} mode={mode} page={page} />
  }
  return <StudentGradesPage userId={ctx.effectiveUserId} mode={mode} page={page} />
}

async function TeacherGradesPage({
  teacherId,
  typeFilter,
  studentIdFilter,
  subjectIdFilter,
  mode,
  page,
}: {
  teacherId: string
  typeFilter?: string
  studentIdFilter?: string
  subjectIdFilter?: string
  mode?: string
  page: number
}) {
  const validTypes = ["mock", "exam", "quiz", "other"] as const
  type ValidType = (typeof validTypes)[number]
  const isValidType = (v: string | undefined): v is ValidType =>
    validTypes.includes(v as ValidType)

  const [{ grades, total }, subjects, students, examEvents] = await Promise.all([
    getTeacherGrades(teacherId, isValidType(typeFilter) ? typeFilter : undefined, studentIdFilter, subjectIdFilter, currentModeForQuery(mode), page),
    getSubjectsByTeacherId(teacherId),
    getTeacherGradeStudents(teacherId),
    getRecentTeacherExamEvents(teacherId),
  ])

  const subjectMap = buildSubjectMap(subjects)

  const prevDiff = previousDiffs(grades, (g) => `${g.studentId}:${g.testType}:${[...g.subjectIds].sort().join(",")}`)
  const currentMode = mode === "analysis" ? "analysis" : "list"

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
      <PageHeader title="成績" description="記録の一覧と、生徒ごとの推移を分けて確認できます。" action={
        students.length > 0 ? (
          <GradeCreateSheet
            compact
            students={students}
            subjects={subjects}
            examEvents={examEvents}
            defaultStudentId={studentIdFilter}
          />
        ) : undefined
      } />
      <GradeModeTabs current={currentMode} params={{ studentId: studentIdFilter, type: typeFilter, subjectId: subjectIdFilter }} />
      <div className="space-y-2">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <GradeStudentFilter students={students} />
          <details className="group relative">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-center rounded-full border bg-background px-4 text-sm font-medium hover:bg-muted active:opacity-75 [&::-webkit-details-marker]:hidden">絞り込み</summary>
            <div className="absolute right-0 top-[calc(100%+0.5rem)] z-30 w-[min(22rem,calc(100vw-2rem))] space-y-3 rounded-lg border bg-popover p-4 shadow-lg">
              <GradeSubjectFilter subjects={subjects} />
              <GradeTypeFilter />
            </div>
          </details>
        </div>
      </div>

      {currentMode === "list" && (studentIdFilter || subjectIdFilter || typeFilter) && (
        <p role="status" className="rounded-lg border bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
          条件に一致する成績は{total}件です。テスト名・生徒・日付・結果を同じ順序で比較できます。
        </p>
      )}

      {currentMode === "analysis" && studentIdFilter && chartGrades.length > 0 && (
        <>
          <GradeChart grades={chartGrades} subjects={subjects} typeFilter={typeFilter} />
          <Disclosure title="科目バランスを見る"><GradeRadar grades={chartGrades} subjects={subjects} /></Disclosure>
        </>
      )}

      {currentMode === "analysis" && !studentIdFilter && <EmptyState title="分析する生徒を選択してください" description="上の生徒選択から1人を選ぶと、成績推移が表示されます。" />}

      {currentMode === "list" && (grades.length === 0 ? (
        <EmptyState
          title="成績記録がありません"
          description={typeFilter
            ? "別のテスト種別を選ぶと記録が見つかる場合があります。"
            : students.length === 0
              ? "成績を記録するには、先に生徒を招待してください。"
              : "最初のテスト結果を記録しましょう。"
          }
          action={!typeFilter ? (
            students.length > 0
              ? <GradeCreateSheet students={students} subjects={subjects} examEvents={examEvents} defaultStudentId={studentIdFilter} />
              : <Link href="/students/invite" className={buttonVariants()}>生徒を招待する</Link>
          ) : undefined}
        />
      ) : (
        <>
          {/* モバイル: カード表示 */}
          <div className="lg:hidden space-y-2">
            {grades.map((g, i) => (
              <div key={g.id} className="apple-card-surface rounded-2xl p-4">
                <GradeCard g={g} diff={prevDiff[i]} subjectMap={subjectMap} studentName={g.student.user.name} />
                <GradeActionsCell gradeId={g.id} size="sm" className="mt-3 border-t pt-3" />
              </div>
            ))}
          </div>
          {/* デスクトップ: テーブル表示 */}
          <div className="apple-card-surface hidden overflow-hidden overflow-x-auto rounded-2xl lg:block">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">テスト名</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">生徒</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">日付</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">結果</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {grades.map((g, i) => (
                  <tr key={g.id} className="hover:bg-muted">
                    <td className="px-4 py-3">
                      <p className="font-medium">{g.testName}</p>
                      <p className="text-xs text-muted-foreground">{TEST_TYPE_LABELS[g.testType as keyof typeof TEST_TYPE_LABELS] ?? g.testType}</p>
                      <SubjectTags ids={g.subjectIds} map={subjectMap} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{g.student.user.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(g.date)}</td>
                    <td className="px-4 py-3">
                      {g.score != null ? (g.maxScore != null ? `${g.score}/${g.maxScore}` : g.score) : "-"}
                      <DiffBadge diff={prevDiff[i]} />
                      <p className="mt-0.5 text-xs text-muted-foreground">{[g.deviation != null ? `偏差値${g.deviation}` : null, g.rank != null ? `${g.rank}${g.totalStudents != null ? `/${g.totalStudents}` : ""}位` : null].filter(Boolean).join(" · ")}</p>
                    </td>
                    <td className="px-4 py-3"><GradeActionsCell gradeId={g.id} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ))}
      {currentMode === "list" && (
        <PaginationNav
          pathname="/grades"
          page={page}
          total={total}
          pageSize={GRADE_PAGE_SIZE}
          params={{ type: typeFilter, studentId: studentIdFilter, subjectId: subjectIdFilter, mode: "list" }}
        />
      )}
    </div>
  )
}

async function StudentGradesPage({ userId, mode, page }: { userId: string; mode?: string; page: number }) {
  const student = await getStudentByUserId(userId)
  if (!student) redirect("/dashboard")

  const currentMode = mode === "history" ? "history" : "trend"
  const [{ grades, total }, subjects] = await Promise.all([
    getStudentGrades(student.id, undefined, currentMode, page),
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

  const prevDiff = previousDiffs(grades, (grade) => `${grade.testType}:${[...grade.subjectIds].sort().join(",")}`)
  const latest = grades[0]

  return (
    <div className="space-y-3">
      <PageHeader title="成績" description="最新の結果と、これまでの変化を確認できます。" />
      {latest && <LatestGradeSummary grade={latest} diff={prevDiff[0]} />}
      <LearningModeTabs current={currentMode} />

      {grades.length === 0 ? (
        <EmptyState title="成績記録がありません" description="先生が成績を登録すると、ここに推移が表示されます。" />
      ) : (
        <>
          {currentMode === "trend" && <>
            <GradeChart grades={chartGrades} subjects={subjects} />
            <Disclosure title="科目バランスを見る"><GradeRadar grades={chartGrades} subjects={subjects} /></Disclosure>
          </>}

          {/* モバイル: カード表示 */}
          <div className={`${currentMode === "history" ? "md:hidden" : "hidden"} space-y-2`}>
            {grades.map((g, i) => (
              <div key={g.id} className="apple-card-surface rounded-2xl p-4">
                <GradeCard g={g} diff={prevDiff[i]} subjectMap={subjectMap} comment={g.comment} />
              </div>
            ))}
          </div>
          {/* デスクトップ: テーブル表示 */}
          <div className={`${currentMode === "history" ? "hidden md:block" : "hidden"} apple-card-surface overflow-hidden overflow-x-auto rounded-2xl`}>
            <table className="w-full text-sm">
              <thead className="border-b bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">テスト名</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">日付</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">結果</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">詳細</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {grades.map((g, i) => (
                  <tr key={g.id} className="hover:bg-muted">
                    <td className="px-4 py-3">
                      <p className="font-medium">{g.testName}</p>
                      <SubjectTags ids={g.subjectIds} map={subjectMap} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(g.date)}</td>
                    <td className="px-4 py-3">
                      {g.score != null ? (g.maxScore != null ? `${g.score}/${g.maxScore}` : g.score) : "-"}
                      <DiffBadge diff={prevDiff[i]} />
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-muted-foreground">{[g.deviation != null ? `偏差値 ${g.deviation}` : null, g.rank != null ? `${g.rank}${g.totalStudents != null ? `/${g.totalStudents}` : ""}位` : null].filter(Boolean).join(" · ") || "-"}</p>
                      {g.comment && <p className="mt-1 max-w-xs truncate text-xs text-muted-foreground">{g.comment}</p>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {currentMode === "history" && (
        <PaginationNav pathname="/grades" page={page} total={total} pageSize={GRADE_PAGE_SIZE} params={{ mode: "history" }} />
      )}
    </div>
  )
}

async function ParentGradesPage({
  parentId,
  studentIdFilter,
  typeFilter,
  mode,
  page,
}: {
  parentId: string
  studentIdFilter?: string
  typeFilter?: string
  mode?: string
  page: number
}) {
  const links = await getParentGradeLinks(parentId)
  if (links.length === 0) {
    return (
      <EmptyState title="お子様の情報が登録されていません" description="先生から保護者招待を受け取ってください。" />
    )
  }

  const allowedStudentIds = links.map((l) => l.studentId)
  const effectiveStudentId = await resolveParentStudentId(allowedStudentIds, studentIdFilter)

  const validTypes = ["mock", "exam", "quiz", "other"] as const
  const isValidType = (v: string | undefined): v is (typeof validTypes)[number] =>
    validTypes.includes(v as (typeof validTypes)[number])

  const currentMode = mode === "history" ? "history" : "trend"
  const { grades, total } = await getStudentGrades(effectiveStudentId, isValidType(typeFilter) ? typeFilter : undefined, currentMode, page)

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

  const prevDiff = previousDiffs(grades, (grade) => `${grade.testType}:${[...grade.subjectIds].sort().join(",")}`)
  const latest = grades[0]

  return (
    <div className="space-y-3">
      <PageHeader title="成績" description="お子さまの最新結果と推移を確認できます。" />
      <ParentStudentSwitcher students={links.map(({ student }) => ({ id: student.id, name: student.user.name }))} selectedStudentId={effectiveStudentId} />

      {latest && <LatestGradeSummary grade={latest} diff={prevDiff[0]} />}
      <LearningModeTabs current={currentMode} studentId={effectiveStudentId} />

      {grades.length === 0 ? (
        <EmptyState title="成績記録がありません" />
      ) : (
        <>
          {currentMode === "trend" && <>
            <GradeChart grades={chartGrades} subjects={subjects} />
            <Disclosure title="科目バランスを見る"><GradeRadar grades={chartGrades} subjects={subjects} /></Disclosure>
          </>}
          <div className={`${currentMode === "history" ? "md:hidden" : "hidden"} space-y-2`}>
            {grades.map((g, i) => (
              <div key={g.id} className="apple-card-surface rounded-2xl p-4">
                <GradeCard g={g} diff={prevDiff[i]} subjectMap={subjectMap} comment={g.comment} />
              </div>
            ))}
          </div>
          <div className={`${currentMode === "history" ? "hidden md:block" : "hidden"} apple-card-surface overflow-hidden overflow-x-auto rounded-2xl`}>
            <table className="w-full text-sm">
              <thead className="border-b bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">テスト名</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">日付</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">結果</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">詳細</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {grades.map((g, i) => (
                  <tr key={g.id} className="hover:bg-muted">
                    <td className="px-4 py-3">
                      <p className="font-medium">{g.testName}</p>
                      <SubjectTags ids={g.subjectIds} map={subjectMap} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(g.date)}</td>
                    <td className="px-4 py-3">
                      {g.score != null ? (g.maxScore != null ? `${g.score}/${g.maxScore}` : g.score) : "-"}
                      <DiffBadge diff={prevDiff[i]} />
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-muted-foreground">{[g.deviation != null ? `偏差値 ${g.deviation}` : null, g.rank != null ? `${g.rank}${g.totalStudents != null ? `/${g.totalStudents}` : ""}位` : null].filter(Boolean).join(" · ") || "-"}</p>
                      {g.comment && <p className="mt-1 max-w-xs truncate text-xs text-muted-foreground">{g.comment}</p>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {currentMode === "history" && (
        <PaginationNav
          pathname="/grades"
          page={page}
          total={total}
          pageSize={GRADE_PAGE_SIZE}
          params={{ mode: "history", studentId: effectiveStudentId, type: typeFilter }}
        />
      )}
    </div>
  )
}

async function getTeacherGrades(
  teacherId: string,
  typeFilter?: "mock" | "exam" | "quiz" | "other",
  studentIdFilter?: string,
  subjectIdFilter?: string,
  mode: "list" | "analysis" = "list",
  page = 1
) {
  "use cache"
  cacheLife(cacheProfiles.active)
  cacheTag(cacheTags.teacherGrades(teacherId))
  const where = {
    teacherId,
    ...(typeFilter ? { testType: typeFilter } : {}),
    ...(studentIdFilter ? { studentId: studentIdFilter } : {}),
    ...(subjectIdFilter ? { subjectIds: { has: subjectIdFilter } } : {}),
  }
  const take = mode === "analysis" ? 200 : GRADE_PAGE_SIZE
  const [grades, total] = await Promise.all([
    db.gradeRecord.findMany({
      where,
      include: { student: { include: { user: { select: { name: true } } } } },
      orderBy: { date: "desc" },
      take,
      skip: mode === "list" ? (page - 1) * GRADE_PAGE_SIZE : 0,
    }),
    db.gradeRecord.count({ where }),
  ])
  return { grades, total }
}

async function getTeacherGradeStudents(teacherId: string) {
  "use cache"
  cacheLife(cacheProfiles.reference)
  cacheTag(cacheTags.teacherStudents(teacherId))
  return db.student.findMany({
    where: { teacherId },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  })
}

async function getRecentTeacherExamEvents(teacherId: string) {
  "use cache"
  cacheLife(cacheProfiles.active)
  cacheTag(cacheTags.teacherCalendar(teacherId))
  const now = new Date()
  const pastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const events = await db.examEvent.findMany({
    where: { teacherId, date: { gte: pastMonth } },
    include: { student: { include: { user: { select: { name: true } } } } },
    orderBy: { date: "desc" },
  })
  return events.map((event) => ({
    id: event.id,
    name: event.name,
    testType: event.testType,
    date: event.date.toISOString().slice(0, 10),
    studentId: event.studentId,
    studentName: event.student.user.name ?? "",
  }))
}

async function getStudentGrades(
  studentId: string,
  typeFilter?: "mock" | "exam" | "quiz" | "other",
  mode: "history" | "trend" = "trend",
  page = 1
) {
  "use cache"
  cacheLife(cacheProfiles.active)
  cacheTag(cacheTags.studentGrades(studentId))
  const where = { studentId, ...(typeFilter ? { testType: typeFilter } : {}) }
  const take = mode === "trend" ? 200 : GRADE_PAGE_SIZE
  const [grades, total] = await Promise.all([
    db.gradeRecord.findMany({
      where,
      orderBy: { date: "desc" },
      take,
      skip: mode === "history" ? (page - 1) * GRADE_PAGE_SIZE : 0,
    }),
    db.gradeRecord.count({ where }),
  ])
  return { grades, total }
}

function currentModeForQuery(mode?: string): "list" | "analysis" {
  return mode === "analysis" ? "analysis" : "list"
}

async function getParentGradeLinks(parentId: string) {
  "use cache"
  cacheLife(cacheProfiles.reference)
  cacheTag(cacheTags.parentStudents(parentId))
  return db.parentStudent.findMany({
    where: { parentId },
    include: { student: { include: { user: { select: { name: true } } } } },
  })
}

function GradeModeTabs({ current, params }: { current: "list" | "analysis"; params: Record<string, string | undefined> }) {
  return (
    <nav aria-label="成績の表示" className="flex rounded-lg border bg-card p-1">
      {[{ value: "list", label: "一覧" }, { value: "analysis", label: "分析" }].map((item) => {
        const search = new URLSearchParams()
        Object.entries(params).forEach(([key, value]) => { if (value) search.set(key, value) })
        search.set("mode", item.value)
        return <Link key={item.value} href={`/grades?${search.toString()}`} prefetch={true} aria-current={current === item.value ? "page" : undefined} className={`flex min-h-11 flex-1 items-center justify-center rounded-md text-sm font-medium active:opacity-75 ${current === item.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>{item.label}</Link>
      })}
    </nav>
  )
}

function LearningModeTabs({ current, studentId }: { current: "trend" | "history"; studentId?: string }) {
  return (
    <nav aria-label="成績の表示" className="flex rounded-lg border bg-card p-1">
      {[{ value: "trend", label: "推移" }, { value: "history", label: "履歴" }].map((item) => (
        <Link key={item.value} href={`/grades?mode=${item.value}${studentId ? `&studentId=${studentId}` : ""}`} prefetch={true} aria-current={current === item.value ? "page" : undefined} className={`flex min-h-11 flex-1 items-center justify-center rounded-md text-sm font-medium active:opacity-75 ${current === item.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>{item.label}</Link>
      ))}
    </nav>
  )
}

function LatestGradeSummary({ grade, diff }: { grade: GradeCardData; diff: number | null }) {
  const primary = grade.score != null ? `${grade.score}${grade.maxScore != null ? `/${grade.maxScore}` : ""}` : grade.deviation != null ? `偏差値 ${grade.deviation}` : "記録あり"
  return (
    <div className="apple-card-surface flex items-end justify-between gap-3 rounded-2xl p-4">
      <div className="min-w-0"><p className="text-xs text-muted-foreground">最新の結果</p><p className="mt-1 truncate font-semibold">{grade.testName}</p><p className="mt-1 text-xs text-muted-foreground">{formatDate(grade.date)}</p></div>
      <p className="shrink-0 text-2xl font-bold tabular-nums">{primary}<DiffBadge diff={diff} /></p>
    </div>
  )
}
