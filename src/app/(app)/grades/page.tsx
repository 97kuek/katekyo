import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import GradeChart from "./grade-chart"
import { GradeActionsCell } from "./grade-actions-cell"
import { GradeTypeFilter } from "./grade-type-filter"
import { TEST_TYPE_LABELS } from "@/lib/test-types"

function SubjectTags({ ids, map }: { ids: string[]; map: Map<string, string> }) {
  const names = ids.map((id) => map.get(id)).filter(Boolean) as string[]
  if (names.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {names.map((name) => (
        <span key={name} className="text-xs bg-blue-50 text-blue-700 rounded-full px-2 py-0.5">
          {name}
        </span>
      ))}
    </div>
  )
}

const TEST_TYPE_BADGE: Record<string, string> = {
  mock: "bg-purple-50 text-purple-700",
  exam: "bg-blue-50 text-blue-700",
  quiz: "bg-green-50 text-green-700",
  other: "bg-gray-100 text-gray-600",
}

export default async function GradesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  const session = await auth()
  if (!session) redirect("/login")

  const { type } = await searchParams

  if (session.user.role === "teacher") {
    return <TeacherGradesPage teacherId={session.user.id} typeFilter={type} />
  }
  return <StudentGradesPage userId={session.user.id} />
}

async function TeacherGradesPage({
  teacherId,
  typeFilter,
}: {
  teacherId: string
  typeFilter?: string
}) {
  const validTypes = ["mock", "exam", "quiz", "other"] as const
  type ValidType = (typeof validTypes)[number]
  const isValidType = (v: string | undefined): v is ValidType =>
    validTypes.includes(v as ValidType)

  const [grades, subjects] = await Promise.all([
    db.gradeRecord.findMany({
      where: {
        teacherId,
        ...(isValidType(typeFilter) ? { testType: typeFilter } : {}),
      },
      include: { student: { include: { user: { select: { name: true } } } } },
      orderBy: { date: "desc" },
    }),
    db.subject.findMany({ where: { teacherId }, select: { id: true, name: true } }),
  ])

  const subjectMap = new Map(subjects.map((s) => [s.id, s.name]))

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold">成績管理</h1>
        <Link href="/grades/new" className={buttonVariants()}>
          成績を記録
        </Link>
      </div>

      <GradeTypeFilter />

      {grades.length === 0 ? (
        <div className="rounded-lg border bg-white p-12 text-center">
          <p className="text-muted-foreground">成績記録がありません</p>
          {!typeFilter && (
            <Link href="/grades/new" className={buttonVariants({ className: "mt-4 inline-flex" })}>
              最初の成績を記録する
            </Link>
          )}
        </div>
      ) : (
        <div className="rounded-lg border bg-white overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">種別</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">テスト名</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">生徒</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">日付</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">得点</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">順位</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">偏差値</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">評価</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {grades.map((g) => (
                <tr key={g.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs rounded-full px-2 py-0.5 ${TEST_TYPE_BADGE[g.testType] ?? TEST_TYPE_BADGE.other}`}
                    >
                      {TEST_TYPE_LABELS[g.testType as keyof typeof TEST_TYPE_LABELS] ?? g.testType}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{g.testName}</p>
                    <SubjectTags ids={g.subjectIds} map={subjectMap} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{g.student.user.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {g.date.toLocaleDateString("ja-JP")}
                  </td>
                  <td className="px-4 py-3">
                    {g.score != null
                      ? g.maxScore != null
                        ? `${g.score}/${g.maxScore}`
                        : g.score
                      : "-"}
                  </td>
                  <td className="px-4 py-3">
                    {g.rank != null
                      ? g.totalStudents != null
                        ? `${g.rank}/${g.totalStudents}`
                        : g.rank
                      : "-"}
                  </td>
                  <td className="px-4 py-3">{g.deviation ?? "-"}</td>
                  <td className="px-4 py-3">
                    {g.teacherRating != null ? "★".repeat(g.teacherRating) : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <GradeActionsCell gradeId={g.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

async function StudentGradesPage({ userId }: { userId: string }) {
  const student = await db.student.findUnique({ where: { userId } })
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
    deviation: g.deviation,
  }))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">成績</h1>

      {grades.length === 0 ? (
        <div className="rounded-lg border bg-white p-12 text-center">
          <p className="text-muted-foreground">まだ成績記録がありません</p>
        </div>
      ) : (
        <>
          <GradeChart grades={chartGrades} />

          <div className="rounded-lg border bg-white overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">テスト名</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">種別</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">日付</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">得点</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">順位</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">偏差値</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">評価</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">コメント</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {grades.map((g) => (
                  <tr key={g.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium">{g.testName}</p>
                      <SubjectTags ids={g.subjectIds} map={subjectMap} />
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs rounded-full px-2 py-0.5 ${TEST_TYPE_BADGE[g.testType] ?? TEST_TYPE_BADGE.other}`}
                      >
                        {TEST_TYPE_LABELS[g.testType as keyof typeof TEST_TYPE_LABELS] ?? g.testType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {g.date.toLocaleDateString("ja-JP")}
                    </td>
                    <td className="px-4 py-3">
                      {g.score != null
                        ? g.maxScore != null
                          ? `${g.score}/${g.maxScore}`
                          : g.score
                        : "-"}
                    </td>
                    <td className="px-4 py-3">
                      {g.rank != null
                        ? g.totalStudents != null
                          ? `${g.rank}/${g.totalStudents}`
                          : g.rank
                        : "-"}
                    </td>
                    <td className="px-4 py-3">{g.deviation ?? "-"}</td>
                    <td className="px-4 py-3">
                      {g.teacherRating != null ? "★".repeat(g.teacherRating) : "-"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                      {g.comment ?? "-"}
                    </td>
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
