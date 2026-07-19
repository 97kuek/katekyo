import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import GradeChart from "@/app/(app)/grades/grade-chart"
import GradeRadar from "@/app/(app)/grades/grade-radar"
import { SubjectTags } from "@/components/ui/subject-tags"
import { getSubjectsByTeacherId, buildSubjectMap } from "@/lib/queries"
import { formatDate } from "@/lib/date-utils"
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

export default async function StudentGradesPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== "teacher") redirect("/dashboard")

  const { id } = await params

  const [student, subjects] = await Promise.all([
    db.student.findUnique({
      where: { id, teacherId: session.user.id },
      include: { user: { select: { name: true } } },
    }),
    getSubjectsByTeacherId(session.user.id),
  ])

  if (!student) notFound()

  const grades = await db.gradeRecord.findMany({
    where: { studentId: student.id, teacherId: session.user.id },
    orderBy: { date: "desc" },
  })

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

  const prevDiff = grades.map((g, i) => {
    const prev = grades[i + 1]
    if (!prev) return null
    const cur = scorePercentage(g.score, g.maxScore) ?? g.deviation
    const pre = scorePercentage(prev.score, prev.maxScore) ?? prev.deviation
    return cur != null && pre != null ? cur - pre : null
  })

  return (
    <div className="space-y-6">
      <div>
        <Link href="/students" className="text-sm text-muted-foreground hover:underline">
          ← 生徒一覧に戻る
        </Link>
        <h1 className="text-2xl font-bold mt-2">{student.user.name} の成績</h1>
        <p className="text-sm text-muted-foreground mt-1">{student.grade}</p>
      </div>

      {grades.length === 0 ? (
        <EmptyState title="成績記録がありません" description="この生徒の最初のテスト結果を記録しましょう。" action={(
          <Link
            href="/grades/new"
            className={buttonVariants()}
          >
            成績を記録する
          </Link>
        )} />
      ) : (
        <>
          <GradeChart grades={chartGrades} subjects={subjects} />
          <GradeRadar grades={chartGrades} subjects={subjects} />

          {/* モバイル: カード表示 */}
          <div className="md:hidden space-y-2">
            {grades.map((g, i) => (
              <div key={g.id} className="rounded-lg border bg-card p-4 space-y-2">
                <div className="min-w-0">
                  <p className="font-medium truncate">{g.testName}</p>
                  <SubjectTags ids={g.subjectIds} map={subjectMap} />
                  <p className="text-xs text-muted-foreground mt-1">{formatDate(g.date)}</p>
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
                </div>
                {g.comment && <p className="text-xs text-muted-foreground border-l-2 pl-2 whitespace-pre-wrap">{g.comment}</p>}
              </div>
            ))}
          </div>
          {/* デスクトップ: テーブル表示 */}
          <div className="hidden md:block rounded-lg border bg-card overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="border-b bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">テスト名</th>
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
