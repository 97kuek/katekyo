import { redirect } from "next/navigation"
import { getViewingContext } from "@/lib/view-as"
import { db } from "@/lib/db"
import { getStudentByUserId, getSubjectsByTeacherId, buildSubjectMap } from "@/lib/queries"
import Link from "next/link"
import { Suspense } from "react"
import { PENDING_STATUSES, isPendingStatus } from "@/lib/homework-status"
import { GARDEN_CAPACITY } from "@/lib/garden/utils"
import { relativeDeadline, deadlineColorClass } from "@/lib/date-utils"
import { ChevronRight, TreePine, Trophy, Video, MapPin, MessageSquareText } from "lucide-react"
import { LessonLogCard } from "./lesson-log-card"
import { UnreadBadge } from "@/components/ui/unread-badge"
import { Skeleton as Sk } from "@/components/ui/skeleton"
import { scorePercentage } from "@/lib/grade-record"
import { PageHeader } from "@/components/ui/page-header"
import { cacheLife, cacheTag } from "next/cache"
import { cacheProfiles } from "@/lib/cache-policy"
import { cacheTags } from "@/lib/cache-tags"

export default async function DashboardPage() {
  const ctx = await getViewingContext()
  if (!ctx) redirect("/login")

  if (ctx.effectiveRole === "teacher") return <TeacherDashboard teacherId={ctx.effectiveUserId} />
  if (ctx.effectiveRole === "parent") return <ParentDashboard parentId={ctx.effectiveUserId} />
  return <StudentDashboard userId={ctx.effectiveUserId} />
}

// ─── Shared ──────────────────────────────────────────────────────────────────

function fmtDay(d: Date) {
  return d.toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo", month: "numeric", day: "numeric", weekday: "short" })
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString("ja-JP", { timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit" })
}

/** セクション見出し。href があれば見出し全体が遷移先へのリンクになる（個別の「〜を見る」リンクを廃止） */
function SectionHeader({ title, count, href }: { title: string; count?: number; href?: string }) {
  const heading = (
    <h2 className="text-sm font-semibold flex items-center gap-1.5">
      {title}
      {count != null && count > 0 && (
        <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-xs font-bold text-foreground">{count}</span>
      )}
    </h2>
  )
  if (!href) return heading
  return (
    <Link href={href} className="group flex items-center justify-between">
      {heading}
      <ChevronRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
    </Link>
  )
}

function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <Sk className="h-5 w-24" />
      <div className="rounded-lg border bg-card divide-y">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="px-4 py-3">
            <Sk className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Teacher ────────────────────────────────────────────────────────────────

function TeacherDashboard({ teacherId }: { teacherId: string }) {
  return (
    <div className="space-y-6">
      <PageHeader title="ホーム" description="今日対応することを優先して表示します。" />
      <Suspense fallback={<SectionSkeleton />}>
        <TeacherActionSection teacherId={teacherId} />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <TeacherWeekSection teacherId={teacherId} />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <TeacherStudentsSection teacherId={teacherId} />
      </Suspense>
    </div>
  )
}

/** 承認待ち・完了確認・期限切れを1つに統合した「要対応」。何も無ければ表示しない */
async function TeacherActionSection({ teacherId }: { teacherId: string }) {
  "use cache"
  cacheLife(cacheProfiles.active)
  cacheTag(cacheTags.teacherHomework(teacherId), cacheTags.teacherCalendar(teacherId))
  const now = new Date()
  const [pendingCount, pending, uncompletedLessons, overdueCount] = await Promise.all([
    db.homework.count({ where: { teacherId, status: "submitted" } }),
    db.homework.findMany({
      where: { teacherId, status: "submitted" },
      include: { student: { include: { user: { select: { name: true } } } } },
      orderBy: { submittedAt: "asc" },
      take: 3,
    }),
    db.lesson.count({ where: { teacherId, date: { lt: now }, completedAt: null } }),
    db.homework.count({ where: { teacherId, status: { in: PENDING_STATUSES }, dueDate: { lt: now } } }),
  ])

  const total = pendingCount + uncompletedLessons + overdueCount
  if (total === 0) return null

  return (
    <section className="space-y-3">
      <SectionHeader title="要対応" count={total} />
      <div className="rounded-lg border bg-card divide-y">
        {pending.map((h) => (
          <Link
            key={h.id}
            href={`/homework/${h.id}/review`}
            className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted active:bg-muted"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{h.title}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{h.student.user.name} · 承認待ち</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
        {pendingCount > 3 && (
          <Link href="/homework" className="flex items-center justify-between px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-muted">
            承認待ち 他{pendingCount - 3}件
            <ChevronRight className="h-4 w-4 shrink-0" />
          </Link>
        )}
        {uncompletedLessons > 0 && (
          <Link href="/calendar" className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted active:bg-muted">
            <span className="flex-1 text-sm">完了確認待ちの授業</span>
            <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs font-bold text-warning-foreground">{uncompletedLessons}</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        )}
        {overdueCount > 0 && (
          <Link href="/homework" className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted active:bg-muted">
            <span className="flex-1 text-sm">期限切れの宿題</span>
            <span className="rounded-full border border-destructive/25 bg-destructive/10 px-2 py-0.5 text-xs font-bold text-foreground">{overdueCount}</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        )}
      </div>
    </section>
  )
}

/** 授業と宿題期限を1本の時系列にまとめた「今週」 */
async function TeacherWeekSection({ teacherId }: { teacherId: string }) {
  "use cache"
  cacheLife(cacheProfiles.active)
  cacheTag(cacheTags.teacherCalendar(teacherId), cacheTags.teacherHomework(teacherId))
  const now = new Date()
  const weekEnd = new Date(now)
  weekEnd.setDate(weekEnd.getDate() + 7)

  const [lessons, deadlines] = await Promise.all([
    db.lesson.findMany({
      where: { teacherId, date: { gte: now, lte: weekEnd } },
      include: { student: { include: { user: { select: { name: true } } } } },
      orderBy: { date: "asc" },
      take: 5,
    }),
    db.homework.findMany({
      where: { teacherId, status: { in: PENDING_STATUSES }, dueDate: { gte: now, lte: weekEnd } },
      include: { student: { include: { user: { select: { name: true } } } } },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
  ])

  const items = [
    ...lessons.map((l) => ({
      key: `l-${l.id}`,
      date: l.date,
      href: "/calendar",
      icon: l.type === "online" ? Video : MapPin,
      title: l.student.user.name,
      sub: `${fmtDay(l.date)} ${fmtTime(l.date)}`,
    })),
    ...deadlines.map((h) => ({
      key: `h-${h.id}`,
      date: h.dueDate,
      href: `/homework/${h.id}`,
      icon: null,
      title: h.title,
      sub: `${h.student.user.name} · 期限 ${fmtDay(h.dueDate)}`,
    })),
  ]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 6)

  return (
    <section className="space-y-3">
      <SectionHeader title="今週" href="/calendar" />
      {items.length === 0 ? (
        <div className="rounded-lg border bg-card p-5 text-center text-sm text-muted-foreground">予定なし</div>
      ) : (
        <div className="rounded-lg border bg-card divide-y">
          {items.map(({ key, href, icon: Icon, title, sub }) => (
            <Link key={key} href={href} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted active:bg-muted">
              {Icon && (
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Icon className="h-4 w-4" />
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{title}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{sub}</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}

/** 宿題ステータス表と成績動向を、生徒別の1行に集約した「生徒」 */
async function TeacherStudentsSection({ teacherId }: { teacherId: string }) {
  "use cache"
  cacheLife(cacheProfiles.active)
  cacheTag(cacheTags.teacherStudents(teacherId), cacheTags.teacherHomework(teacherId), cacheTags.teacherGrades(teacherId))
  const [students, hwStats] = await Promise.all([
    db.student.findMany({
      where: { teacherId },
      include: {
        user: { select: { name: true } },
        grades: { orderBy: { date: "desc" }, take: 2 },
      },
      orderBy: { createdAt: "asc" },
    }),
    db.homework.groupBy({ by: ["studentId", "status"], where: { teacherId }, _count: { status: true } }),
  ])
  if (students.length === 0) return null

  const stat = new Map<string, { active: number; submitted: number }>()
  for (const row of hwStats) {
    const entry = stat.get(row.studentId) ?? { active: 0, submitted: 0 }
    if (row.status === "submitted") entry.submitted += row._count.status
    else if (row.status === "assigned" || row.status === "rejected") entry.active += row._count.status
    stat.set(row.studentId, entry)
  }

  type Grade = (typeof students)[0]["grades"][0]
  const val = (g: Grade) => scorePercentage(g.score, g.maxScore) ?? g.deviation

  return (
    <section className="space-y-3">
      <SectionHeader title="生徒" href="/students" />
      <div className="rounded-lg border bg-card divide-y">
        {students.map((s) => {
          const { active, submitted } = stat.get(s.id) ?? { active: 0, submitted: 0 }
          let diff: number | null = null
          if (s.grades.length >= 2) {
            const [latest, prev] = s.grades
            const a = val(latest)
            const b = val(prev)
            if (a != null && b != null && Math.abs(a - b) >= 1) diff = a - b
          }
          return (
            <Link key={s.id} href={`/students/${s.id}`} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted active:bg-muted">
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{s.user.name}</span>
              {submitted > 0 && (
                <span className="shrink-0 rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning-foreground">承認待ち {submitted}</span>
              )}
              {active > 0 && (
                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">宿題 {active}</span>
              )}
              {diff != null && (
                <span className={`shrink-0 text-sm font-bold ${diff > 0 ? "text-primary" : "text-destructive"}`}>
                  {diff > 0 ? "↑" : "↓"}{Math.abs(Math.round(diff))}
                </span>
              )}
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
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
      <PageHeader title="ホーム" description="今日やることと、次の予定を確認しましょう。" />
      <Suspense fallback={<SectionSkeleton />}>
        <StudentTodoSection userId={userId} />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <StudentWeekSection userId={userId} />
      </Suspense>
      <Suspense fallback={<Sk className="h-24 w-full rounded-lg" />}>
        <StudentGardenPreview userId={userId} />
      </Suspense>
      <Suspense fallback={null}>
        <StudentRecentLogs userId={userId} />
      </Suspense>
    </div>
  )
}

/** 未読フィードバックと提出すべき宿題を1つにまとめた「やること」 */
async function StudentTodoSection({ userId }: { userId: string }) {
  "use cache"
  cacheLife(cacheProfiles.active)
  cacheTag(cacheTags.user(userId))
  const student = await getStudentByUserId(userId)
  if (!student) return null
  cacheTag(cacheTags.studentHomework(student.id))

  const [feedbacks, active, activeCount] = await Promise.all([
    db.homework.findMany({
      where: {
        studentId: student.id,
        teacherFeedback: { not: null },
        feedbackSeenAt: null,
        status: { in: ["approved", "rejected"] },
      },
      orderBy: { reviewedAt: "desc" },
      take: 1,
      select: { id: true, title: true, teacherFeedback: true },
    }),
    db.homework.findMany({
      where: { studentId: student.id, status: { in: PENDING_STATUSES } },
      orderBy: { dueDate: "asc" },
      take: 1,
      select: { id: true, title: true, dueDate: true },
    }),
    db.homework.count({ where: { studentId: student.id, status: { in: PENDING_STATUSES } } }),
  ])
  if (feedbacks.length === 0 && active.length === 0) return null

  return (
    <section className="space-y-3">
      <SectionHeader title="やること" count={activeCount + feedbacks.length} href="/homework" />
      <div className="rounded-lg border bg-card divide-y">
        {feedbacks.map((h) => (
          <Link
            key={h.id}
            href={`/homework/${h.id}`}
            className="flex items-center gap-3 bg-primary/5 px-4 py-3 transition-colors hover:bg-primary/10"
          >
            <MessageSquareText className="h-4 w-4 shrink-0 text-primary" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{h.title}</span>
              <span className="mt-0.5 block truncate text-xs text-muted-foreground">{h.teacherFeedback}</span>
            </span>
            <UnreadBadge />
          </Link>
        ))}
        {active.map((h) => (
          <Link
            key={h.id}
            href={`/homework/${h.id}/submit`}
            className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted active:bg-muted"
          >
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{h.title}</span>
            <span className={`shrink-0 text-xs font-medium ${deadlineColorClass(h.dueDate)}`}>{relativeDeadline(h.dueDate)}</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </section>
  )
}

/** 授業とテストを1本の時系列にまとめた「今週」 */
async function StudentWeekSection({ userId }: { userId: string }) {
  "use cache"
  cacheLife(cacheProfiles.active)
  cacheTag(cacheTags.user(userId))
  const student = await getStudentByUserId(userId)
  if (!student) return null
  cacheTag(cacheTags.studentCalendar(student.id))

  const now = new Date()
  const weekEnd = new Date(now)
  weekEnd.setDate(weekEnd.getDate() + 7)
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const [lessons, exams] = await Promise.all([
    db.lesson.findMany({
      where: { studentId: student.id, date: { gte: now, lte: weekEnd } },
      orderBy: { date: "asc" },
      take: 3,
    }),
    db.examEvent.findMany({
      where: { studentId: student.id, date: { gte: now } },
      orderBy: { date: "asc" },
      take: 3,
    }),
  ])

  const items = [
    ...lessons.map((l) => ({
      key: `l-${l.id}`,
      date: l.date,
      icon: l.type === "online" ? Video : MapPin,
      title: l.type === "online" ? "オンライン授業" : "対面授業",
      sub: `${fmtDay(l.date)} ${fmtTime(l.date)}`,
      badge: null as string | null,
      urgent: false,
    })),
    ...exams.map((e) => {
      const examMidnight = new Date(e.date.getFullYear(), e.date.getMonth(), e.date.getDate())
      const diffDays = Math.round((examMidnight.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24))
      const badge = diffDays === 0 ? "今日" : diffDays === 1 ? "明日" : `${diffDays}日後`
      return {
        key: `e-${e.id}`,
        date: e.date,
        icon: null,
        title: e.name,
        sub: fmtDay(e.date),
        badge,
        urgent: diffDays <= 3,
      }
    }),
  ].sort((a, b) => a.date.getTime() - b.date.getTime())

  if (items.length === 0) return null

  return (
    <section className="space-y-3">
      <SectionHeader title="今週" href="/calendar" />
      <div className="rounded-lg border bg-card divide-y">
        {items.map(({ key, icon: Icon, title, sub, badge, urgent }) => (
          <div key={key} className="flex items-center gap-3 px-4 py-3">
            {Icon && (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Icon className="h-4 w-4" />
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{title}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{sub}</span>
            </span>
            {badge && <span className={`shrink-0 text-sm font-bold ${urgent ? "text-destructive" : ""}`}>{badge}</span>}
          </div>
        ))}
      </div>
    </section>
  )
}

async function StudentGardenPreview({ userId }: { userId: string }) {
  "use cache"
  cacheLife(cacheProfiles.active)
  cacheTag(cacheTags.user(userId))
  const student = await getStudentByUserId(userId)
  if (!student) return null
  cacheTag(cacheTags.garden(student.id))

  const count = await db.gardenItem.count({ where: { studentId: student.id } })
  const max = GARDEN_CAPACITY
  const pct = Math.round((count / max) * 100)
  const isFull = count >= max
  const generation = student.gardenGeneration

  return (
    <section className="space-y-3">
      <SectionHeader title="学習の森" href="/garden" />
      <Link
        href="/garden"
        className={`block space-y-3 rounded-lg border p-4 transition-opacity hover:opacity-90 ${isFull ? "border-warning/40 bg-warning/10" : "bg-card"}`}
      >
        <div className="flex items-center gap-3">
          {isFull ? (
            <Trophy className="h-9 w-9 shrink-0 text-warning" />
          ) : (
            <TreePine className="h-9 w-9 shrink-0 text-primary" />
          )}
          <div>
            <p className={`text-2xl font-bold leading-none ${isFull ? "text-warning" : ""}`}>{count}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">/ {max}</p>
          </div>
          {generation > 1 && !isFull && (
            <span className="ml-auto rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-xs font-medium text-foreground">第{generation}世代</span>
          )}
          {isFull && (
            <span className="ml-auto rounded-full border border-warning/30 bg-warning/15 px-2 py-0.5 text-xs font-bold text-foreground">満開達成</span>
          )}
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-[width,background-color] motion-reduce:transition-none ${isFull ? "bg-warning" : "bg-primary"}`}
            style={{ width: `${count > 0 ? Math.max(pct, 3) : 0}%` }}
          />
        </div>
        {count === 0 && <p className="text-xs text-muted-foreground">宿題が承認されると森が育ちます</p>}
      </Link>
    </section>
  )
}

async function StudentRecentLogs({ userId }: { userId: string }) {
  "use cache"
  cacheLife(cacheProfiles.active)
  cacheTag(cacheTags.user(userId))
  const student = await getStudentByUserId(userId)
  if (!student) return null
  cacheTag(cacheTags.studentCalendar(student.id), cacheTags.subjects(student.teacherId))

  const lessons = await db.lesson.findMany({
    where: {
      studentId: student.id,
      lessonLogPublic: true,
      lessonLog: { not: null },
    },
    orderBy: { date: "desc" },
    take: 1,
    select: { id: true, date: true, lessonLog: true, subjectIds: true, lessonLogSeenAt: true },
  })
  if (lessons.length === 0) return null

  const subjects = await getSubjectsByTeacherId(student.teacherId)
  const subjectMap = buildSubjectMap(subjects)

  // 未読を先頭に（同グループ内は新しい順を維持）
  const sorted = [...lessons].sort(
    (a, b) => Number(a.lessonLogSeenAt !== null) - Number(b.lessonLogSeenAt !== null)
  )
  const unreadCount = lessons.filter((l) => l.lessonLogSeenAt === null).length

  return (
    <section className="space-y-3">
      <SectionHeader title="授業ログ" count={unreadCount} href="/calendar" />
      <div className="space-y-2">
        {sorted.map((l) => {
          const subjectNames = l.subjectIds.map((id) => subjectMap.get(id)).filter(Boolean) as string[]
          return (
            <LessonLogCard
              key={l.id}
              lessonId={l.id}
              unread={l.lessonLogSeenAt === null}
              date={fmtDay(l.date)}
              subjectNames={subjectNames}
              log={l.lessonLog!}
            />
          )
        })}
      </div>
    </section>
  )
}

// ─── Parent ──────────────────────────────────────────────────────────────────

function ParentDashboard({ parentId }: { parentId: string }) {
  return (
    <div className="space-y-6">
      <PageHeader title="ホーム" description="お子さまごとの要対応と最新状況を確認できます。" />
      <Suspense fallback={<Sk className="h-48 w-full rounded-lg" />}>
        <ParentStudentList parentId={parentId} />
      </Suspense>
    </div>
  )
}

async function ParentStudentList({ parentId }: { parentId: string }) {
  "use cache"
  cacheLife(cacheProfiles.active)
  cacheTag(cacheTags.parentStudents(parentId))
  const now = new Date()
  const links = await db.parentStudent.findMany({
    where: { parentId },
    include: {
      student: {
        include: {
          user: { select: { name: true } },
          homeworks: { select: { status: true } },
          lessons: {
            where: { date: { gte: new Date() } },
            orderBy: { date: "asc" },
            take: 1,
            select: { date: true, type: true },
          },
          grades: {
            orderBy: { date: "desc" },
            take: 1,
            select: { testName: true, score: true, maxScore: true, date: true },
          },
          monthlyPayments: {
            where: { year: now.getFullYear(), month: now.getMonth() + 1 },
            take: 1,
            select: { paidAt: true, dueDate: true },
          },
        },
      },
    },
  })

  for (const { student } of links) {
    cacheTag(
      cacheTags.studentHomework(student.id),
      cacheTags.studentCalendar(student.id),
      cacheTags.studentGrades(student.id),
      cacheTags.studentBilling(student.id)
    )
  }

  if (links.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-12 text-center text-sm text-muted-foreground">
        まだお子様の情報が登録されていません。先生から招待リンクを受け取ってください。
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {links.map(({ student }) => {
        const pendingHw = student.homeworks.filter((h) => isPendingStatus(h.status)).length
        const nextLesson = student.lessons[0]
        const latestGrade = student.grades[0]
        const payment = student.monthlyPayments[0]

        return (
          <div key={student.id} className="space-y-4 rounded-lg border bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-base font-semibold">{student.user.name}</p>
              <span className="text-xs text-muted-foreground">{student.grade}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Link href={`/homework?studentId=${student.id}`} className="rounded-md bg-muted p-3 transition-colors hover:bg-muted/70">
                <p className="text-xs text-muted-foreground">要対応</p>
                <p className="mt-0.5 text-xl font-bold">{pendingHw}<span className="ml-1 text-sm font-normal text-muted-foreground">件</span></p>
              </Link>
              <Link href={`/calendar?studentId=${student.id}`} className="rounded-md bg-muted p-3 transition-colors hover:bg-muted/70">
                <p className="text-xs text-muted-foreground">次の授業</p>
                <p className="mt-0.5 text-sm font-medium">
                  {nextLesson ? fmtDay(nextLesson.date) : <span className="text-muted-foreground">-</span>}
                </p>
              </Link>
              <Link href={`/grades?studentId=${student.id}`} className="rounded-md bg-muted p-3 transition-colors hover:bg-muted/70">
                <p className="text-xs text-muted-foreground">直近の成績</p>
                <p className="mt-0.5 text-sm font-medium">
                  {latestGrade
                    ? latestGrade.score != null && latestGrade.maxScore != null
                      ? `${latestGrade.score}/${latestGrade.maxScore}点`
                      : latestGrade.testName
                    : <span className="text-muted-foreground">-</span>
                  }
                </p>
              </Link>
              <Link href={`/billing?studentId=${student.id}`} className="rounded-md bg-muted p-3 transition-colors hover:bg-muted/70">
                <p className="text-xs text-muted-foreground">今月の請求</p>
                <p className="mt-0.5 text-sm font-medium">{payment?.paidAt ? "入金済み" : payment ? "未入金" : "記録なし"}</p>
              </Link>
            </div>
          </div>
        )
      })}
    </div>
  )
}
