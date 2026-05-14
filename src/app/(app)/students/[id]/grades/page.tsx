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
        <span key={name} className="text-xs bg-blue-50 text-blue-700 rounded-full px-2 py-0.5">
          {name}
        </span>
      ))}
    </div>
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
    date: g.date.toISOString(),
    score: g.score,
    maxScore: g.maxScore,
    deviation: g.deviation,
  }))

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
        <div className="rounded-lg border bg-white p-12 text-center">
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
          <GradeChart grades={chartGrades} />

          <div className="rounded-lg border bg-white overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">テスト名</th>
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
