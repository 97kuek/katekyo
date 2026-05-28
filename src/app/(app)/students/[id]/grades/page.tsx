import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import GradeChart from "@/app/(app)/grades/grade-chart"

function SubjectTags({ ids, map }: { ids: string[]; map: Map<string, string> }) {
  const names = ids.map((id) => map.get(id)).filter(Boolean) as string[]
  if (names.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {names.map((name) => (
        <span key={name} className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5">
          {name}
        </span>
      ))}
    </div>
  )
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

export default async function StudentGradesPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== "teacher") redirect("/dashboard")

  const { id } = await params

  const [student, subjects] = await Promise.all([
    db.student.findUnique({
      where: { id, teacherId: session.user.id },
      include: { user: { select: { name: true } } },
    }),
    db.subject.findMany({
      where: { teacherId: session.user.id },
      select: { id: true, name: true },
    }),
  ])

  if (!student) notFound()

  const grades = await db.gradeRecord.findMany({
    where: { studentId: student.id, teacherId: session.user.id },
    orderBy: { date: "desc" },
  })

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
      <div>
        <Link href="/students" className="text-sm text-muted-foreground hover:underline">
          ← 生徒一覧に戻る
        </Link>
        <h1 className="text-2xl font-bold mt-2">{student.user.name} の成績</h1>
        <p className="text-sm text-muted-foreground mt-1">{student.grade}</p>
      </div>

      {grades.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">まだ成績記録がありません</p>
          <Link
            href="/grades/new"
            className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            成績を記録する
          </Link>
        </div>
      ) : (
        <>
          <GradeChart grades={chartGrades} subjects={subjects} />

          {/* モバイル: カード表示 */}
          <div className="md:hidden space-y-2">
            {grades.map((g, i) => (
              <div key={g.id} className="rounded-lg border bg-card p-4 space-y-2">
                <div className="min-w-0">
                  <p className="font-medium truncate">{g.testName}</p>
                  <SubjectTags ids={g.subjectIds} map={subjectMap} />
                  <p className="text-xs text-muted-foreground mt-1">{g.date.toLocaleDateString("ja-JP")}</p>
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
            <table className="w-full text-sm min-w-[640px]">
              <thead className="border-b bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">テスト名</th>
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
