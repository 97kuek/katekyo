import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"

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

  const [pendingCount, studentCount, gradeCount, overdueCount, pendingHomeworks, upcomingLessons, upcomingDeadlines] = await Promise.all([
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
  ])

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

  const [incompleteCount, overdueCount, latestGrade, upcomingLessons, upcomingDeadlines] = await Promise.all([
    db.homework.count({
      where: { studentId: student.id, status: { in: ["assigned", "rejected"] } },
    }),
    db.homework.count({
      where: { studentId: student.id, status: { in: ["assigned", "rejected"] }, dueDate: { lt: now } },
    }),
    db.gradeRecord.findFirst({
      where: { studentId: student.id },
      orderBy: { date: "desc" },
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

  const latestScore =
    latestGrade?.score != null
      ? latestGrade.maxScore != null
        ? `${latestGrade.score}/${latestGrade.maxScore}`
        : String(latestGrade.score)
      : latestGrade?.deviation != null
        ? `偏差値 ${latestGrade.deviation}`
        : "-"

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard title="未完了の宿題" value={String(incompleteCount)} accent={incompleteCount > 0} href="/homework" />
        <SummaryCard title="期限切れ" value={String(overdueCount)} accent={overdueCount > 0} href="/homework" />
        <SummaryCard title="直近の成績" value={latestScore} sub={latestGrade?.testName} href="/grades" />
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
