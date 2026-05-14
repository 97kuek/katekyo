import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import GradeChart from "./grade-chart"

export default async function GradesPage() {
  const session = await auth()
  if (!session) redirect("/login")

  if (session.user.role === "teacher") {
    return <TeacherGradesPage teacherId={session.user.id} />
  }
  return <StudentGradesPage userId={session.user.id} />
}

async function TeacherGradesPage({ teacherId }: { teacherId: string }) {
  const grades = await db.gradeRecord.findMany({
    where: { teacherId },
    include: { student: { include: { user: { select: { name: true } } } } },
    orderBy: { date: "desc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">成績管理</h1>
        <Link href="/grades/new" className={buttonVariants()}>
          成績を記録
        </Link>
      </div>

      {grades.length === 0 ? (
        <div className="rounded-lg border bg-white p-12 text-center">
          <p className="text-muted-foreground">まだ成績記録がありません</p>
          <Link href="/grades/new" className={buttonVariants({ className: "mt-4 inline-flex" })}>
            最初の成績を記録する
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">テスト名</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">生徒</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">日付</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">得点</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">順位</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">偏差値</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">評価</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {grades.map((g) => (
                <tr key={g.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{g.testName}</td>
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

  const grades = await db.gradeRecord.findMany({
    where: { studentId: student.id },
    orderBy: { date: "desc" },
  })

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
      <h1 className="text-2xl font-bold">成績</h1>

      {grades.length === 0 ? (
        <div className="rounded-lg border bg-white p-12 text-center">
          <p className="text-muted-foreground">まだ成績記録がありません</p>
        </div>
      ) : (
        <>
          <GradeChart grades={chartGrades} />

          <div className="rounded-lg border bg-white overflow-hidden">
            <table className="w-full text-sm">
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
                    <td className="px-4 py-3 font-medium">{g.testName}</td>
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
