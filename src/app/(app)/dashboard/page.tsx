import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getStudentByUserId } from "@/lib/queries"
import Link from "next/link"
import { Suspense } from "react"
import { buttonVariants } from "@/components/ui/button"
import { TEST_TYPE_LABELS } from "@/lib/test-types"
import { TreePine, Trophy } from "lucide-react"

function Sk({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className ?? ""}`} />
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect("/login")

  return session.user.role === "teacher" ? (
    <TeacherDashboard teacherId={session.user.id} />
  ) : (
    <StudentDashboard userId={session.user.id} />
  )
}

// ─── Teacher ────────────────────────────────────────────────────────────────

function TeacherDashboard({ teacherId }: { teacherId: string }) {
  return (
    <div className="space-y-6">
      <Suspense fallback={null}>
        <UncompletedLessonsSection teacherId={teacherId} />
      </Suspense>

      {/* 承認待ちを最上部に */}
      <Suspense fallback={null}>
        <PendingHomeworksSection teacherId={teacherId} />
      </Suspense>

      <Suspense fallback={
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-lg border bg-white p-3 space-y-2">
              <Sk className="h-3 w-20" /><Sk className="h-7 w-10" />
            </div>
          ))}
        </div>
      }>
        <TeacherSummaryCards teacherId={teacherId} />
      </Suspense>

      <Suspense fallback={
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Sk className="h-5 w-32" />
              {[...Array(3)].map((_, j) => <Sk key={j} className="h-14 w-full rounded-lg" />)}
            </div>
          ))}
        </div>
      }>
        <TeacherUpcomingSection teacherId={teacherId} />
      </Suspense>

      <Suspense fallback={<Sk className="h-40 w-full rounded-lg" />}>
        <HomeworkStatusSection teacherId={teacherId} />
      </Suspense>

      <Suspense fallback={<Sk className="h-32 w-full rounded-lg" />}>
        <GradeTrendsSection teacherId={teacherId} />
      </Suspense>
    </div>
  )
}

async function TeacherSummaryCards({ teacherId }: { teacherId: string }) {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const [pendingCount, studentCount, gradeCount, overdueCount] = await Promise.all([
    db.homework.count({ where: { teacherId, status: "submitted" } }),
    db.student.count({ where: { teacherId } }),
    db.gradeRecord.count({ where: { teacherId, createdAt: { gte: monthStart } } }),
    db.homework.count({ where: { teacherId, status: "assigned", dueDate: { lt: now } } }),
  ])
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <SummaryCard title="承認待ち" value={String(pendingCount)} accent={pendingCount > 0} href="/homework" />
      <SummaryCard title="期限切れ" value={String(overdueCount)} danger={overdueCount > 0} href="/homework" />
      <SummaryCard title="登録生徒数" value={String(studentCount)} href="/students" />
      <SummaryCard title="今月の成績" value={String(gradeCount)} href="/grades" />
    </div>
  )
}

async function UncompletedLessonsSection({ teacherId }: { teacherId: string }) {
  const now = new Date()
  const count = await db.lesson.count({
    where: { teacherId, date: { lt: now }, completedAt: null },
  })
  if (count === 0) return null

  return (
    <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0 text-base">📋</div>
        <div>
          <p className="text-sm font-semibold text-orange-900">{count}件の授業が完了確認待ちです</p>
          <p className="text-xs text-orange-700 mt-0.5">カレンダーから授業を完了にしてください</p>
        </div>
      </div>
      <Link href="/calendar" className={buttonVariants({ variant: "outline", size: "sm", className: "shrink-0 border-orange-300 text-orange-800 hover:bg-orange-100" })}>
        カレンダーへ
      </Link>
    </div>
  )
}

async function PendingHomeworksSection({ teacherId }: { teacherId: string }) {
  const [pendingCount, pendingHomeworks] = await Promise.all([
    db.homework.count({ where: { teacherId, status: "submitted" } }),
    db.homework.findMany({
      where: { teacherId, status: "submitted" },
      include: { student: { include: { user: { select: { name: true } } } } },
      orderBy: { submittedAt: "desc" },
      take: 5,
    }),
  ])
  if (pendingHomeworks.length === 0) return null
  return (
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
          <div key={h.id} className="rounded-lg border bg-white p-3 flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-sm">{h.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{h.student.user.name}</p>
            </div>
            <Link href={`/homework/${h.id}/review`} className={buttonVariants({ variant: "outline", size: "sm", className: "shrink-0" })}>
              確認する
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}

async function TeacherUpcomingSection({ teacherId }: { teacherId: string }) {
  const now = new Date()
  const weekEnd = new Date(now); weekEnd.setDate(weekEnd.getDate() + 7)
  const [upcomingLessons, upcomingDeadlines] = await Promise.all([
    db.lesson.findMany({
      where: { teacherId, date: { gte: now, lte: weekEnd } },
      include: { student: { include: { user: { select: { name: true } } } } },
      orderBy: { date: "asc" }, take: 5,
    }),
    db.homework.findMany({
      where: { teacherId, status: { in: ["assigned", "rejected"] }, dueDate: { gte: now, lte: weekEnd } },
      include: { student: { include: { user: { select: { name: true } } } } },
      orderBy: { dueDate: "asc" }, take: 5,
    }),
  ])

  const hasDeadlines = upcomingDeadlines.length > 0

  return (
    <div className={`grid gap-6 ${hasDeadlines ? "md:grid-cols-2" : ""}`}>
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">今後7日の授業</h2>
          <Link href="/calendar" className="text-xs text-muted-foreground hover:underline">カレンダーを見る</Link>
        </div>
        {upcomingLessons.length === 0 ? (
          <div className="rounded-lg border bg-white p-5 text-center text-sm text-muted-foreground">予定なし</div>
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
                    {l.date.toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo", month: "short", day: "numeric", weekday: "short" })}{" "}
                    {l.date.toLocaleTimeString("ja-JP", { timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit" })}
                    {l.durationMin ? `（${l.durationMin}分）` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {hasDeadlines && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">今後7日の宿題期限</h2>
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
                <p className="text-xs text-muted-foreground mt-0.5">{h.student.user.name}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

async function HomeworkStatusSection({ teacherId }: { teacherId: string }) {
  const [homeworkStats, students] = await Promise.all([
    db.homework.groupBy({ by: ["studentId", "status"], where: { teacherId }, _count: { status: true } }),
    db.student.findMany({ where: { teacherId }, include: { user: { select: { name: true } } } }),
  ])
  if (homeworkStats.length === 0 || students.length === 0) return null

  type StatusKey = "assigned" | "submitted" | "approved" | "rejected"
  const statusMap = new Map<string, Record<StatusKey, number>>()
  for (const s of students) statusMap.set(s.id, { assigned: 0, submitted: 0, approved: 0, rejected: 0 })
  for (const row of homeworkStats) {
    const entry = statusMap.get(row.studentId)
    if (entry) entry[row.status as StatusKey] = row._count.status
  }

  const colors: Record<StatusKey, string> = {
    assigned: "bg-gray-100 text-gray-700",
    submitted: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  }
  const statusItems = [
    { key: "assigned" as StatusKey, label: "未提出" },
    { key: "submitted" as StatusKey, label: "提出済" },
    { key: "approved" as StatusKey, label: "承認済" },
    { key: "rejected" as StatusKey, label: "差戻し" },
  ]

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold">生徒別 宿題ステータス</h2>

      {/* モバイル: カード表示 */}
      <div className="md:hidden space-y-2">
        {students.map((s) => {
          const stat = statusMap.get(s.id) ?? { assigned: 0, submitted: 0, approved: 0, rejected: 0 }
          if (stat.assigned + stat.submitted + stat.approved + stat.rejected === 0) return null
          return (
            <div key={s.id} className="rounded-lg border bg-white p-3">
              <p className="text-sm font-medium mb-2">{s.user.name}</p>
              <div className="grid grid-cols-4 gap-1.5 text-center">
                {statusItems.map(({ key, label }) => (
                  <div key={key} className={`rounded-md py-1.5 ${colors[key]}`}>
                    <p className="text-base font-bold leading-none">{stat[key]}</p>
                    <p className="text-xs mt-0.5 opacity-70">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* デスクトップ: テーブル表示 */}
      <div className="hidden md:block rounded-lg border bg-white overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[400px]">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">生徒</th>
              {statusItems.map(({ label }) => (
                <th key={label} className="px-3 py-2.5 text-center font-medium text-muted-foreground">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {students.map((s) => {
              const stat = statusMap.get(s.id) ?? { assigned: 0, submitted: 0, approved: 0, rejected: 0 }
              if (stat.assigned + stat.submitted + stat.approved + stat.rejected === 0) return null
              return (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium">{s.user.name}</td>
                  {statusItems.map(({ key }) => (
                    <td key={key} className="px-3 py-2.5 text-center">
                      {stat[key] > 0 ? (
                        <span className={`inline-flex items-center justify-center h-5 min-w-5 rounded-full text-xs font-medium px-1.5 ${colors[key]}`}>
                          {stat[key]}
                        </span>
                      ) : <span className="text-muted-foreground">-</span>}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

async function GradeTrendsSection({ teacherId }: { teacherId: string }) {
  const recentGrades = await db.gradeRecord.findMany({
    where: { teacherId },
    include: { student: { include: { user: { select: { name: true } } } } },
    orderBy: { date: "desc" },
    take: 60,
  })

  const gradesByStudent = new Map<string, typeof recentGrades>()
  for (const g of recentGrades) {
    const list = gradesByStudent.get(g.studentId) ?? []
    if (list.length < 2) { list.push(g); gradesByStudent.set(g.studentId, list) }
  }

  const gradeTrends = Array.from(gradesByStudent.values())
    .map((gs) => {
      if (gs.length < 2) return null
      const [latest, prev] = gs
      const val = (g: typeof gs[0]) => g.score != null && g.maxScore != null ? (g.score / g.maxScore) * 100 : g.deviation
      const latestVal = val(latest); const prevVal = val(prev)
      if (latestVal == null || prevVal == null) return null
      const diff = latestVal - prevVal
      if (Math.abs(diff) < 1) return null
      return { studentId: latest.studentId, name: latest.student.user.name, diff, latest }
    })
    .filter(Boolean)
    .sort((a, b) => Math.abs(b!.diff) - Math.abs(a!.diff))
    .slice(0, 5) as NonNullable<{ studentId: string; name: string; diff: number; latest: typeof recentGrades[0] }>[]

  if (gradeTrends.length === 0) return null

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">直近の成績動向</h2>
        <Link href="/grades" className="text-xs text-muted-foreground hover:underline">成績一覧</Link>
      </div>
      <div className="rounded-lg border bg-white divide-y">
        {gradeTrends.map((t) => {
          const up = t.diff > 0
          return (
            <div key={t.studentId} className="flex items-center gap-3 px-4 py-2.5">
              <span className={`text-base font-bold w-4 shrink-0 ${up ? "text-green-600" : "text-red-600"}`}>
                {up ? "↑" : "↓"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{t.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {TEST_TYPE_LABELS[t.latest.testType as keyof typeof TEST_TYPE_LABELS]}「{t.latest.testName}」
                </p>
              </div>
              <span className={`text-sm font-bold shrink-0 ${up ? "text-green-600" : "text-red-600"}`}>
                {up ? "+" : ""}{Math.round(t.diff)}{t.latest.deviation != null ? "" : "%"}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}

// ─── Student ─────────────────────────────────────────────────────────────────

function StudentDashboard({ userId }: { userId: string }) {
  return (
    <div className="space-y-6">
      <Suspense fallback={
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-lg border bg-white p-3 space-y-2">
              <Sk className="h-3 w-20" /><Sk className="h-7 w-10" />
            </div>
          ))}
        </div>
      }>
        <StudentSummaryCards userId={userId} />
      </Suspense>

      <Suspense fallback={<Sk className="h-28 w-full rounded-lg" />}>
        <StudentUpcomingExams userId={userId} />
      </Suspense>

      <Suspense fallback={
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Sk className="h-5 w-32" />
              {[...Array(2)].map((_, j) => <Sk key={j} className="h-14 w-full rounded-lg" />)}
            </div>
          ))}
        </div>
      }>
        <StudentUpcomingSection userId={userId} />
      </Suspense>

      <Suspense fallback={<Sk className="h-24 w-full rounded-lg" />}>
        <StudentGardenPreview userId={userId} />
      </Suspense>
    </div>
  )
}

async function StudentSummaryCards({ userId }: { userId: string }) {
  const student = await getStudentByUserId(userId)
  if (!student) return (
    <div className="grid gap-4 md:grid-cols-2">
      <SummaryCard title="未完了の宿題" value="0" />
      <SummaryCard title="次のテスト" value="-" />
    </div>
  )

  const now = new Date()
  const [incompleteCount, overdueCount, submittedCount] = await Promise.all([
    db.homework.count({ where: { studentId: student.id, status: { in: ["assigned", "rejected"] } } }),
    db.homework.count({ where: { studentId: student.id, status: { in: ["assigned", "rejected"] }, dueDate: { lt: now } } }),
    db.homework.count({ where: { studentId: student.id, status: "submitted" } }),
  ])

  return (
    <div className="grid grid-cols-3 gap-3">
      <SummaryCard title="未完了" value={String(incompleteCount)} accent={incompleteCount > 0} href="/homework" />
      <SummaryCard title="期限切れ" value={String(overdueCount)} danger={overdueCount > 0} href="/homework" />
      <SummaryCard title="承認待ち" value={String(submittedCount)} href="/homework" />
    </div>
  )
}

async function StudentUpcomingSection({ userId }: { userId: string }) {
  const student = await getStudentByUserId(userId)
  if (!student) return null

  const now = new Date()
  const weekEnd = new Date(now); weekEnd.setDate(weekEnd.getDate() + 7)
  const [upcomingLessons, upcomingDeadlines] = await Promise.all([
    db.lesson.findMany({
      where: { studentId: student.id, date: { gte: now, lte: weekEnd } },
      orderBy: { date: "asc" }, take: 3,
    }),
    db.homework.findMany({
      where: { studentId: student.id, status: { in: ["assigned", "rejected"] }, dueDate: { gte: now, lte: weekEnd } },
      orderBy: { dueDate: "asc" }, take: 5,
    }),
  ])

  const hasDeadlines = upcomingDeadlines.length > 0

  return (
    <div className={`grid gap-6 ${hasDeadlines ? "md:grid-cols-2" : ""}`}>
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">今後7日の授業</h2>
          <Link href="/calendar" className="text-xs text-muted-foreground hover:underline">カレンダー</Link>
        </div>
        {upcomingLessons.length === 0 ? (
          <div className="rounded-lg border bg-white p-5 text-center text-sm text-muted-foreground">予定なし</div>
        ) : (
          <div className="space-y-2">
            {upcomingLessons.map((l) => (
              <div key={l.id} className="rounded-lg border bg-white p-3 flex items-center gap-3">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${l.type === "online" ? "bg-green-100 text-green-700" : "bg-purple-100 text-purple-700"}`}>
                  {l.type === "online" ? "ON" : "OF"}
                </div>
                <div>
                  <p className="text-sm font-medium">{l.type === "online" ? "オンライン授業" : "対面授業"}</p>
                  <p className="text-xs text-muted-foreground">
                    {l.date.toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo", month: "short", day: "numeric", weekday: "short" })}{" "}
                    {l.date.toLocaleTimeString("ja-JP", { timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit" })}
                    {l.durationMin ? `（${l.durationMin}分）` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {hasDeadlines && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">今後7日の期限</h2>
            <Link href="/homework" className="text-xs text-muted-foreground hover:underline">宿題一覧</Link>
          </div>
          <div className="space-y-2">
            {upcomingDeadlines.map((h) => (
              <div key={h.id} className="rounded-lg border bg-white p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{h.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    期限: {h.dueDate.toLocaleDateString("ja-JP", { month: "short", day: "numeric" })}
                  </p>
                </div>
                <Link href={`/homework/${h.id}/submit`} className={buttonVariants({ size: "sm", className: "shrink-0" })}>
                  提出する
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

async function StudentUpcomingExams({ userId }: { userId: string }) {
  const student = await getStudentByUserId(userId)
  if (!student) return null

  const now = new Date()
  const exams = await db.examEvent.findMany({
    where: { studentId: student.id, date: { gte: now } },
    orderBy: { date: "asc" },
    take: 5,
  })
  if (exams.length === 0) return null

  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">直近のテスト</h2>
        <Link href="/calendar" className="text-xs text-muted-foreground hover:underline">カレンダー</Link>
      </div>
      <div className="rounded-lg border bg-white divide-y">
        {exams.map((e) => {
          const examMidnight = new Date(e.date.getFullYear(), e.date.getMonth(), e.date.getDate())
          const diffDays = Math.round((examMidnight.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24))
          const urgent = diffDays <= 3
          const soon = !urgent && diffDays <= 7
          return (
            <div key={e.id} className="px-4 py-3 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{e.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {TEST_TYPE_LABELS[e.testType as keyof typeof TEST_TYPE_LABELS]}
                  {" · "}
                  {e.date.toLocaleDateString("ja-JP", { month: "short", day: "numeric", weekday: "short" })}
                </p>
              </div>
              <p className={`text-sm font-bold shrink-0 ${urgent ? "text-red-600" : soon ? "text-yellow-600" : ""}`}>
                {diffDays === 0 ? "今日" : diffDays === 1 ? "明日" : diffDays === 2 ? "明後日" : `${diffDays}日後`}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

async function StudentGardenPreview({ userId }: { userId: string }) {
  const student = await getStudentByUserId(userId)
  if (!student) return null

  const count = await db.gardenItem.count({ where: { studentId: student.id } })
  const max = 64
  const pct = Math.round((count / max) * 100)
  const isFull = count >= max
  const generation = student.gardenGeneration

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">学習の森</h2>
        <Link href="/garden" className="text-xs text-muted-foreground hover:underline">
          森を見る
        </Link>
      </div>
      <Link
        href="/garden"
        className={`block rounded-lg border p-4 hover:opacity-90 transition-opacity space-y-3 ${isFull ? "bg-amber-50 border-amber-300" : "bg-white"}`}
      >
        <div className="flex items-center gap-3">
          {isFull ? (
            <Trophy className="h-9 w-9 text-amber-500 shrink-0" />
          ) : (
            <TreePine className="h-9 w-9 text-green-500 shrink-0" />
          )}
          <div>
            <p className={`text-2xl font-bold leading-none ${isFull ? "text-amber-700" : ""}`}>{count}</p>
            <p className="text-xs text-muted-foreground mt-0.5">/ {max} アイテム</p>
          </div>
          {generation > 1 && !isFull && (
            <span className="ml-auto text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">第{generation}世代</span>
          )}
          {isFull && (
            <span className="ml-auto text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">満開達成</span>
          )}
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${isFull ? "bg-amber-400" : "bg-green-500"}`}
            style={{ width: `${count > 0 ? Math.max(pct, 3) : 0}%` }}
          />
        </div>
        {count === 0 && (
          <p className="text-xs text-muted-foreground">宿題が承認されると森にアイテムが育ちます</p>
        )}
      </Link>
    </section>
  )
}

// ─── Shared ──────────────────────────────────────────────────────────────────

function SummaryCard({ title, value, accent, danger, sub, href }: {
  title: string; value: string; accent?: boolean; danger?: boolean; sub?: string; href?: string
}) {
  const inner = (
    <div className={`rounded-lg border bg-white p-3 shadow-sm transition-colors
      ${danger ? "border-red-300" : accent ? "border-yellow-300" : ""}
      ${href ? "hover:bg-gray-50" : ""}`}>
      <p className="text-xs text-muted-foreground">{title}</p>
      <p className={`mt-1 text-2xl font-bold ${danger ? "text-red-600" : accent ? "text-yellow-700" : ""}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5 truncate">{sub}</p>}
    </div>
  )
  if (href) return <Link href={href}>{inner}</Link>
  return inner
}
