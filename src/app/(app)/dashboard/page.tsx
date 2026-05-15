import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { TEST_TYPE_LABELS } from "@/lib/test-types"

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {session.user.role === "teacher" ? "生徒の進捗を確認しましょう" : "今日の宿題を確認しましょう"}
        </p>
      </div>

      {session.user.role === "teacher" ? (
        <TeacherDashboard teacherId={session.user.id} />
      ) : (
        <StudentDashboard userId={session.user.id} />
      )}
    </div>
  )
}

async function TeacherDashboard({ teacherId }: { teacherId: string }) {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const weekEnd = new Date(now)
  weekEnd.setDate(weekEnd.getDate() + 7)

  const [
    pendingCount,
    studentCount,
    gradeCount,
    overdueCount,
    pendingHomeworks,
    upcomingLessons,
    upcomingDeadlines,
    homeworkStats,
    recentGrades,
    students,
  ] = await Promise.all([
    db.homework.count({ where: { teacherId, status: "submitted" } }),
    db.student.count({ where: { teacherId } }),
    db.gradeRecord.count({ where: { teacherId, createdAt: { gte: monthStart } } }),
    db.homework.count({ where: { teacherId, status: "assigned", dueDate: { lt: now } } }),
    db.homework.findMany({
      where: { teacherId, status: "submitted" },
      include: { student: { include: { user: { select: { name: true } } } } },
      orderBy: { submittedAt: "desc" },
      take: 5,
    }),
    db.lesson.findMany({
      where: { teacherId, date: { gte: now, lte: weekEnd } },
      include: { student: { include: { user: { select: { name: true } } } } },
      orderBy: { date: "asc" },
      take: 5,
    }),
    db.homework.findMany({
      where: { teacherId, status: { in: ["assigned", "rejected"] }, dueDate: { gte: now, lte: weekEnd } },
      include: { student: { include: { user: { select: { name: true } } } } },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    db.homework.groupBy({
      by: ["studentId", "status"],
      where: { teacherId },
      _count: { status: true },
    }),
    db.gradeRecord.findMany({
      where: { teacherId },
      include: { student: { include: { user: { select: { name: true } } } } },
      orderBy: { date: "desc" },
      take: 60,
    }),
    db.student.findMany({
      where: { teacherId },
      include: { user: { select: { name: true } } },
    }),
  ])

  // 生徒ごとの宿題ステータス集計
  type StatusKey = "assigned" | "submitted" | "approved" | "rejected"
  const statusMap = new Map<string, Record<StatusKey, number>>()
  for (const s of students) {
    statusMap.set(s.id, { assigned: 0, submitted: 0, approved: 0, rejected: 0 })
  }
  for (const row of homeworkStats) {
    const entry = statusMap.get(row.studentId)
    if (entry) entry[row.status as StatusKey] = row._count.status
  }

  // 生徒ごとの成績動向（直近2件を比較）
  const gradesByStudent = new Map<string, typeof recentGrades>()
  for (const g of recentGrades) {
    const list = gradesByStudent.get(g.studentId) ?? []
    if (list.length < 2) {
      list.push(g)
      gradesByStudent.set(g.studentId, list)
    }
  }
  const gradeTrends = Array.from(gradesByStudent.entries())
    .map(([studentId, gs]) => {
      if (gs.length < 2) return null
      const [latest, prev] = gs
      const latestVal = latest.score != null && latest.maxScore != null
        ? (latest.score / latest.maxScore) * 100
        : latest.deviation
      const prevVal = prev.score != null && prev.maxScore != null
        ? (prev.score / prev.maxScore) * 100
        : prev.deviation
      if (latestVal == null || prevVal == null) return null
      const diff = latestVal - prevVal
      if (Math.abs(diff) < 1) return null
      return { studentId, name: gs[0].student.user.name, diff, latest, prev }
    })
    .filter(Boolean)
    .sort((a, b) => Math.abs(b!.diff) - Math.abs(a!.diff))
    .slice(0, 5) as NonNullable<{
      studentId: string
      name: string
      diff: number
      latest: (typeof recentGrades)[0]
      prev: (typeof recentGrades)[0]
    }>[]

  const hasHomeworkData = homeworkStats.length > 0

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title="承認待ちの宿題" value={String(pendingCount)} accent={pendingCount > 0} href="/homework" />
        <SummaryCard title="期限切れの宿題" value={String(overdueCount)} accent={overdueCount > 0} href="/homework" />
        <SummaryCard title="登録生徒数" value={String(studentCount)} href="/students" />
        <SummaryCard title="今月の成績記録" value={String(gradeCount)} href="/grades" />
      </div>

      {pendingHomeworks.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-yellow-800 bg-yellow-50 px-3 py-1.5 rounded-md inline-flex items-center gap-1.5">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-yellow-600 text-white text-xs">
                {pendingCount}
              </span>
              承認待ちの宿題
            </h2>
            <Link href="/homework" className="text-xs text-muted-foreground hover:underline">すべて見る</Link>
          </div>
          <div className="space-y-2">
            {pendingHomeworks.map((h) => (
              <div key={h.id} className="rounded-lg border bg-white p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-sm">{h.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{h.student.user.name}</p>
                </div>
                <Link
                  href={`/homework/${h.id}/review`}
                  className={buttonVariants({ variant: "outline", size: "sm", className: "shrink-0" })}
                >
                  確認する
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">今後7日の授業</h2>
            <Link href="/calendar" className="text-xs text-muted-foreground hover:underline">カレンダーを見る</Link>
          </div>
          {upcomingLessons.length === 0 ? (
            <div className="rounded-lg border bg-white p-6 text-center text-sm text-muted-foreground">
              予定なし
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingLessons.map((l) => (
                <div key={l.id} className="rounded-lg border bg-white p-3 flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${l.type === "online" ? "bg-green-100 text-green-700" : "bg-purple-100 text-purple-700"}`}>
                    {l.type === "online" ? "ON" : "OF"}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{l.student.user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {l.date.toLocaleDateString("ja-JP", { month: "short", day: "numeric", weekday: "short" })}
                      {" "}
                      {l.date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                      {l.durationMin ? `（${l.durationMin}分）` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">今後7日の宿題期限</h2>
            <Link href="/homework" className="text-xs text-muted-foreground hover:underline">宿題一覧</Link>
          </div>
          {upcomingDeadlines.length === 0 ? (
            <div className="rounded-lg border bg-white p-6 text-center text-sm text-muted-foreground">
              期限なし
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingDeadlines.map((h) => (
                <Link key={h.id} href={`/homework/${h.id}`} className="block rounded-lg border bg-white p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate">{h.title}</p>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {h.dueDate.toLocaleDateString("ja-JP", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{h.student.user.name}</p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* 宿題ステータス分布 */}
      {hasHomeworkData && students.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">生徒別 宿題ステータス</h2>
          <div className="rounded-lg border bg-white overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[400px]">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">生徒</th>
                  <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">未提出</th>
                  <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">提出済</th>
                  <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">承認済</th>
                  <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">差戻し</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {students.map((s) => {
                  const stat = statusMap.get(s.id) ?? { assigned: 0, submitted: 0, approved: 0, rejected: 0 }
                  const total = stat.assigned + stat.submitted + stat.approved + stat.rejected
                  if (total === 0) return null
                  return (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-medium">{s.user.name}</td>
                      <td className="px-3 py-2.5 text-center">
                        {stat.assigned > 0 ? (
                          <span className="inline-flex items-center justify-center h-5 min-w-5 rounded-full bg-gray-100 text-gray-700 text-xs font-medium px-1.5">
                            {stat.assigned}
                          </span>
                        ) : <span className="text-muted-foreground">-</span>}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {stat.submitted > 0 ? (
                          <span className="inline-flex items-center justify-center h-5 min-w-5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium px-1.5">
                            {stat.submitted}
                          </span>
                        ) : <span className="text-muted-foreground">-</span>}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {stat.approved > 0 ? (
                          <span className="inline-flex items-center justify-center h-5 min-w-5 rounded-full bg-green-100 text-green-700 text-xs font-medium px-1.5">
                            {stat.approved}
                          </span>
                        ) : <span className="text-muted-foreground">-</span>}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {stat.rejected > 0 ? (
                          <span className="inline-flex items-center justify-center h-5 min-w-5 rounded-full bg-red-100 text-red-700 text-xs font-medium px-1.5">
                            {stat.rejected}
                          </span>
                        ) : <span className="text-muted-foreground">-</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 成績動向 */}
      {gradeTrends.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">直近の成績動向</h2>
            <Link href="/grades" className="text-xs text-muted-foreground hover:underline">成績一覧</Link>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {gradeTrends.map((t) => {
              const up = t.diff > 0
              return (
                <div key={t.studentId} className="rounded-lg border bg-white p-3 flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${up ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {up ? "↑" : "↓"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{t.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {TEST_TYPE_LABELS[t.latest.testType as keyof typeof TEST_TYPE_LABELS]} {t.latest.testName}
                      <span className={`ml-1 font-medium ${up ? "text-green-600" : "text-red-600"}`}>
                        {up ? "+" : ""}{Math.round(t.diff)}
                        {t.latest.deviation != null ? "" : "%"}
                      </span>
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

async function StudentDashboard({ userId }: { userId: string }) {
  const student = await db.student.findUnique({ where: { userId } })
  if (!student) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <SummaryCard title="未完了の宿題" value="0" />
        <SummaryCard title="直近の成績" value="-" />
      </div>
    )
  }

  const now = new Date()
  const weekEnd = new Date(now)
  weekEnd.setDate(weekEnd.getDate() + 7)

  const [incompleteCount, overdueCount, submittedCount, recentGrades, upcomingLessons, upcomingDeadlines] = await Promise.all([
    db.homework.count({
      where: { studentId: student.id, status: { in: ["assigned", "rejected"] } },
    }),
    db.homework.count({
      where: { studentId: student.id, status: { in: ["assigned", "rejected"] }, dueDate: { lt: now } },
    }),
    db.homework.count({
      where: { studentId: student.id, status: "submitted" },
    }),
    db.gradeRecord.findMany({
      where: { studentId: student.id },
      orderBy: { date: "desc" },
      take: 5,
      select: { id: true, testName: true, testType: true, date: true, score: true, maxScore: true, deviation: true },
    }),
    db.lesson.findMany({
      where: { studentId: student.id, date: { gte: now, lte: weekEnd } },
      include: { student: { include: { user: { select: { name: true } } } } },
      orderBy: { date: "asc" },
      take: 3,
    }),
    db.homework.findMany({
      where: { studentId: student.id, status: { in: ["assigned", "rejected"] }, dueDate: { gte: now, lte: weekEnd } },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
  ])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title="未完了の宿題" value={String(incompleteCount)} accent={incompleteCount > 0} href="/homework" />
        <SummaryCard title="期限切れ" value={String(overdueCount)} accent={overdueCount > 0} href="/homework" />
        <SummaryCard title="承認待ち" value={String(submittedCount)} href="/homework" />
        <SummaryCard
          title="直近の成績"
          value={
            recentGrades[0]?.score != null
              ? recentGrades[0].maxScore != null
                ? `${recentGrades[0].score}/${recentGrades[0].maxScore}`
                : String(recentGrades[0].score)
              : recentGrades[0]?.deviation != null
                ? `偏差値 ${recentGrades[0].deviation}`
                : "-"
          }
          sub={recentGrades[0]?.testName}
          href="/grades"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">今後7日の授業</h2>
            <Link href="/calendar" className="text-xs text-muted-foreground hover:underline">カレンダー</Link>
          </div>
          {upcomingLessons.length === 0 ? (
            <div className="rounded-lg border bg-white p-6 text-center text-sm text-muted-foreground">
              予定なし
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingLessons.map((l) => (
                <div key={l.id} className="rounded-lg border bg-white p-3 flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${l.type === "online" ? "bg-green-100 text-green-700" : "bg-purple-100 text-purple-700"}`}>
                    {l.type === "online" ? "ON" : "OF"}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {l.type === "online" ? "オンライン授業" : "対面授業"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {l.date.toLocaleDateString("ja-JP", { month: "short", day: "numeric", weekday: "short" })}
                      {" "}
                      {l.date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                      {l.durationMin ? `（${l.durationMin}分）` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {upcomingDeadlines.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">今後7日の期限</h2>
              <Link href="/homework" className="text-xs text-muted-foreground hover:underline">宿題一覧</Link>
            </div>
            <div className="space-y-2">
              {upcomingDeadlines.map((h) => (
                <Link key={h.id} href={`/homework/${h.id}`} className="block rounded-lg border bg-white p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate">{h.title}</p>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {h.dueDate.toLocaleDateString("ja-JP", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* 直近の成績リスト */}
      {recentGrades.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">直近の成績</h2>
            <Link href="/grades" className="text-xs text-muted-foreground hover:underline">成績一覧</Link>
          </div>
          <div className="rounded-lg border bg-white divide-y">
            {recentGrades.map((g) => (
              <div key={g.id} className="px-4 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{g.testName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {TEST_TYPE_LABELS[g.testType as keyof typeof TEST_TYPE_LABELS]}
                    {" · "}
                    {g.date.toLocaleDateString("ja-JP", { month: "short", day: "numeric" })}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  {g.score != null ? (
                    <p className="text-sm font-bold">
                      {g.maxScore != null ? `${g.score}/${g.maxScore}` : g.score}
                    </p>
                  ) : g.deviation != null ? (
                    <p className="text-sm font-bold">偏差値 {g.deviation}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">-</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function SummaryCard({
  title,
  value,
  accent,
  sub,
  href,
}: {
  title: string
  value: string
  accent?: boolean
  sub?: string
  href?: string
}) {
  const inner = (
    <div className={`rounded-lg border bg-white p-5 shadow-sm transition-colors ${accent ? "border-yellow-300" : ""} ${href ? "hover:bg-gray-50" : ""}`}>
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className={`mt-2 text-3xl font-bold ${accent ? "text-yellow-700" : ""}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1 truncate">{sub}</p>}
    </div>
  )
  if (href) return <Link href={href}>{inner}</Link>
  return inner
}
