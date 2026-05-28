import { redirect } from "next/navigation"
import { getViewingContext } from "@/lib/view-as"
import { db } from "@/lib/db"
import { getStudentByUserId } from "@/lib/queries"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import GradeChart from "./grade-chart"
import { GradeActionsCell } from "./grade-actions-cell"
import { GradeTypeFilter } from "./grade-type-filter"
import { GradeStudentFilter } from "./grade-student-filter"
import { TEST_TYPE_LABELS } from "@/lib/test-types"

function SubjectTags({ ids, map }: { ids: string[]; map: Map<string, string> }) {
  const names = ids.map((id) => map.get(id)).filter(Boolean) as string[]
  if (names.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {names.map((name) => (
        <span key={name} className="text-xs bg-muted text-foreground rounded-full px-2 py-0.5">
          {name}
        </span>
      ))}
    </div>
  )
}

const TEST_TYPE_BADGE: Record<string, string> = {
  mock:  "bg-muted text-foreground",
  exam:  "bg-muted text-foreground",
  quiz:  "bg-muted text-foreground",
  other: "bg-muted text-foreground",
}

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

export default async function GradesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; studentId?: string }>
}) {
  const ctx = await getViewingContext()
  if (!ctx) redirect("/login")

  const { type, studentId } = await searchParams

  if (ctx.effectiveRole === "teacher") {
    return <TeacherGradesPage teacherId={ctx.effectiveUserId} typeFilter={type} studentIdFilter={studentId} />
  }
  return <StudentGradesPage userId={ctx.effectiveUserId} />
}

async function TeacherGradesPage({
  teacherId,
  typeFilter,
  studentIdFilter,
}: {
  teacherId: string
  typeFilter?: string
  studentIdFilter?: string
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
      },
      include: { student: { include: { user: { select: { name: true } } } } },
      orderBy: { date: "desc" },
    }),
    db.subject.findMany({ where: { teacherId }, select: { id: true, name: true } }),
    db.student.findMany({
      where: { teacherId },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ])

  const subjectMap = new Map(subjects.map((s) => [s.id, s.name]))

  // 前回比計算（生徒別・日付降順で並んでいるので index+1 が前回）
  const prevIndexByStudent = new Map<string, number>()
  const prevDiff = grades.map((g) => {
    const prevIdx = prevIndexByStudent.get(g.studentId)
    prevIndexByStudent.set(g.studentId, grades.indexOf(g))
    if (prevIdx == null) return null
    const prev = grades[prevIdx]
    const cur =
      g.score != null && g.maxScore != null ? (g.score / g.maxScore) * 100 : g.score ?? g.deviation
    const pre =
      prev.score != null && prev.maxScore != null
        ? (prev.score / prev.maxScore) * 100
        : prev.score ?? prev.deviation
    return cur != null && pre != null ? cur - pre : null
  })

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
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">成績管理</h1>

      <div className="flex items-center gap-2 justify-between flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <GradeStudentFilter students={students} />
          <GradeTypeFilter />
        </div>
        <Link href="/grades/new" className={buttonVariants({ size: "sm" })}>
          成績を記録
        </Link>
      </div>

      {studentIdFilter && chartGrades.length > 0 && (
        <GradeChart grades={chartGrades} subjects={subjects} />
      )}

      {grades.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">成績記録がありません</p>
          {!typeFilter && (
            <Link href="/grades/new" className={buttonVariants({ className: "mt-4 inline-flex" })}>
              最初の成績を記録する
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* モバイル: カード表示 */}
          <div className="md:hidden space-y-2">
            {grades.map((g, i) => (
              <div key={g.id} className="rounded-lg border bg-card p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{g.testName}</p>
                    <SubjectTags ids={g.subjectIds} map={subjectMap} />
                    <p className="text-xs text-muted-foreground mt-1">
                      {g.student.user.name} · {g.date.toLocaleDateString("ja-JP")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs rounded-full px-2 py-0.5 ${TEST_TYPE_BADGE[g.testType] ?? TEST_TYPE_BADGE.other}`}>
                      {TEST_TYPE_LABELS[g.testType as keyof typeof TEST_TYPE_LABELS] ?? g.testType}
                    </span>
                    <GradeActionsCell gradeId={g.id} />
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  {g.score != null && (
                    <span>
                      得点: {g.maxScore != null ? `${g.score}/${g.maxScore}` : g.score}
                      <DiffBadge diff={prevDiff[i]} />
                    </span>
                  )}
                  {g.avgScore != null && g.score != null && (
                    <span className="flex items-center gap-1">対平均: <VsAvg score={g.score} avgScore={g.avgScore} /></span>
                  )}
                  {g.deviation != null && <span>偏差値: {g.deviation}</span>}
                  {g.rank != null && (
                    <span>順位: {g.rank}{g.totalStudents != null ? `/${g.totalStudents}` : ""}</span>
                  )}
                  {g.teacherRating != null && <span>{"★".repeat(g.teacherRating)}</span>}
                </div>
              </div>
            ))}
          </div>
          {/* デスクトップ: テーブル表示 */}
          <div className="hidden md:block rounded-lg border bg-card overflow-hidden overflow-x-auto">
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
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">評価</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {grades.map((g, i) => (
                  <tr key={g.id} className="hover:bg-muted">
                    <td className="px-4 py-3">
                      <span className={`text-xs rounded-full px-2 py-0.5 ${TEST_TYPE_BADGE[g.testType] ?? TEST_TYPE_BADGE.other}`}>
                        {TEST_TYPE_LABELS[g.testType as keyof typeof TEST_TYPE_LABELS] ?? g.testType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{g.testName}</p>
                      <SubjectTags ids={g.subjectIds} map={subjectMap} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{g.student.user.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{g.date.toLocaleDateString("ja-JP")}</td>
                    <td className="px-4 py-3">
                      {g.score != null ? (g.maxScore != null ? `${g.score}/${g.maxScore}` : g.score) : "-"}
                      <DiffBadge diff={prevDiff[i]} />
                    </td>
                    <td className="px-4 py-3"><VsAvg score={g.score} avgScore={g.avgScore} /></td>
                    <td className="px-4 py-3">
                      {g.rank != null ? (g.totalStudents != null ? `${g.rank}/${g.totalStudents}` : g.rank) : "-"}
                    </td>
                    <td className="px-4 py-3">{g.deviation ?? "-"}</td>
                    <td className="px-4 py-3">{g.teacherRating != null ? "★".repeat(g.teacherRating) : "-"}</td>
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
    db.subject.findMany({ where: { teacherId: student.teacherId }, select: { id: true, name: true } }),
  ])

  const subjectMap = new Map(subjects.map((s) => [s.id, s.name]))

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

  // 前回比
  const prevDiff = grades.map((g, i) => {
    const prev = grades[i + 1]
    if (!prev) return null
    const cur =
      g.score != null && g.maxScore != null ? (g.score / g.maxScore) * 100 : g.score ?? g.deviation
    const pre =
      prev.score != null && prev.maxScore != null
        ? (prev.score / prev.maxScore) * 100
        : prev.score ?? prev.deviation
    return cur != null && pre != null ? cur - pre : null
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">成績</h1>

      {grades.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">まだ成績記録がありません</p>
        </div>
      ) : (
        <>
          <GradeChart grades={chartGrades} subjects={subjects} />

          {/* モバイル: カード表示 */}
          <div className="md:hidden space-y-2">
            {grades.map((g, i) => (
              <div key={g.id} className="rounded-lg border bg-card p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{g.testName}</p>
                    <SubjectTags ids={g.subjectIds} map={subjectMap} />
                    <p className="text-xs text-muted-foreground mt-1">{g.date.toLocaleDateString("ja-JP")}</p>
                  </div>
                  <span className={`text-xs rounded-full px-2 py-0.5 shrink-0 ${TEST_TYPE_BADGE[g.testType] ?? TEST_TYPE_BADGE.other}`}>
                    {TEST_TYPE_LABELS[g.testType as keyof typeof TEST_TYPE_LABELS] ?? g.testType}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  {g.score != null && (
                    <span>
                      得点: {g.maxScore != null ? `${g.score}/${g.maxScore}` : g.score}
                      <DiffBadge diff={prevDiff[i]} />
                    </span>
                  )}
                  {g.avgScore != null && g.score != null && (
                    <span className="flex items-center gap-1">対平均: <VsAvg score={g.score} avgScore={g.avgScore} /></span>
                  )}
                  {g.deviation != null && <span>偏差値: {g.deviation}</span>}
                  {g.rank != null && (
                    <span>順位: {g.rank}{g.totalStudents != null ? `/${g.totalStudents}` : ""}</span>
                  )}
                  {g.teacherRating != null && <span>{"★".repeat(g.teacherRating)}</span>}
                </div>
                {g.comment && <p className="text-xs text-muted-foreground border-l-2 pl-2">{g.comment}</p>}
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
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">評価</th>
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
                      <span className={`text-xs rounded-full px-2 py-0.5 ${TEST_TYPE_BADGE[g.testType] ?? TEST_TYPE_BADGE.other}`}>
                        {TEST_TYPE_LABELS[g.testType as keyof typeof TEST_TYPE_LABELS] ?? g.testType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{g.date.toLocaleDateString("ja-JP")}</td>
                    <td className="px-4 py-3">
                      {g.score != null ? (g.maxScore != null ? `${g.score}/${g.maxScore}` : g.score) : "-"}
                      <DiffBadge diff={prevDiff[i]} />
                    </td>
                    <td className="px-4 py-3"><VsAvg score={g.score} avgScore={g.avgScore} /></td>
                    <td className="px-4 py-3">
                      {g.rank != null ? (g.totalStudents != null ? `${g.rank}/${g.totalStudents}` : g.rank) : "-"}
                    </td>
                    <td className="px-4 py-3">{g.deviation ?? "-"}</td>
                    <td className="px-4 py-3">{g.teacherRating != null ? "★".repeat(g.teacherRating) : "-"}</td>
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
