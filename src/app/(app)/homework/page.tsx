import { redirect } from "next/navigation"
import { getViewingContext } from "@/lib/view-as"
import { db } from "@/lib/db"
import { getStudentByUserId, getSubjectsByTeacherId, buildSubjectMap } from "@/lib/queries"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { StatusBadge } from "@/components/homework/status-badge"
import { UnreadBadge } from "@/components/ui/unread-badge"
import { HomeworkFilter } from "./homework-filter"
import { BulkApproveSection } from "./bulk-approve-section"
import { relativeDeadline, deadlineColorClass, formatDate } from "@/lib/date-utils"
import { isPendingStatus } from "@/lib/homework-status"
import { SubjectTags } from "@/components/ui/subject-tags"
import { HomeworkCard } from "./homework-card"
import { HomeworkActions } from "./homework-actions"
import { EmptyState } from "@/components/ui/empty-state"
import { PageHeader } from "@/components/ui/page-header"
import { HomeworkViewTabs } from "./homework-view-tabs"
import { ParentStudentSwitcher } from "@/components/parent-student-switcher"
import { resolveParentStudentId } from "@/lib/parent-student-context"
import { cacheLife, cacheTag } from "next/cache"
import { cacheProfiles } from "@/lib/cache-policy"
import { cacheTags } from "@/lib/cache-tags"
import { PaginationNav } from "@/components/ui/pagination-nav"

const HOMEWORK_PAGE_SIZE = 40

export default async function HomeworkPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string; sort?: string; q?: string; subjects?: string; view?: string; page?: string }>
}) {
  const ctx = await getViewingContext()
  if (!ctx) redirect("/login")

  const { studentId, sort, q, subjects, view, page: pageParam } = await searchParams
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1)

  if (ctx.effectiveRole === "teacher") {
    return <TeacherHomeworkPage teacherId={ctx.effectiveUserId} studentIdFilter={studentId} sort={sort} q={q} subjectFilter={subjects} view={view} page={page} />
  }
  if (ctx.effectiveRole === "parent") {
    return <ParentHomeworkPage parentId={ctx.effectiveUserId} studentIdFilter={studentId} view={view} page={page} />
  }
  return <StudentHomeworkPage userId={ctx.effectiveUserId} view={view} page={page} />
}

async function TeacherHomeworkPage({
  teacherId,
  studentIdFilter,
  sort,
  q,
  subjectFilter,
  view,
  page,
}: {
  teacherId: string
  studentIdFilter?: string
  sort?: string
  q?: string
  subjectFilter?: string
  view?: string
  page: number
}) {
  const [{ homeworks, counts, currentView, total, allTotal }, subjects, students] = await Promise.all([
    getTeacherHomeworks(teacherId, studentIdFilter, sort, q, subjectFilter, view, page),
    getSubjectsByTeacherId(teacherId),
    getTeacherHomeworkStudents(teacherId),
  ])

  const subjectMap = buildSubjectMap(subjects)
  const now = new Date()
  const submitted = currentView === "review" ? homeworks : []
  const visibleHomeworks = currentView === "review" ? [] : homeworks

  return (
    <div className="space-y-4">
      <PageHeader
        title="宿題"
        description="確認が必要な宿題から順に整理しています。"
        action={
          <Link href={studentIdFilter ? `/homework/new?studentId=${studentIdFilter}` : "/homework/new"} className={buttonVariants({ size: "sm", className: "gap-1.5 shrink-0" })}>
          <Plus className="h-4 w-4 shrink-0" />
          宿題を作成
          </Link>
        }
      />

      <HomeworkViewTabs
        current={currentView}
        items={[
          { value: "review", label: "確認待ち", count: counts.review },
          { value: "active", label: "進行中", count: counts.active },
          { value: "completed", label: "完了", count: counts.completed },
        ]}
        params={{ studentId: studentIdFilter, sort, q, subjects: subjectFilter }}
      />

      <HomeworkFilter students={students} subjects={subjects} />

      {(q || studentIdFilter || subjectFilter) && (
        <p role="status" className="rounded-lg border bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
          条件に一致する宿題は{total}件です。タイトル・生徒・期限・状態を同じ順序で比較できます。
        </p>
      )}

      {currentView === "review" && submitted.length > 0 && (
        <BulkApproveSection submitted={submitted} subjectMap={subjectMap} />
      )}

      {currentView === "review" && submitted.length === 0 && allTotal > 0 && (
        <EmptyState title="確認待ちの宿題はありません" description="提出されるとここに表示されます。" />
      )}

      {currentView !== "review" && visibleHomeworks.length > 0 && (
        <section className="space-y-3">
          <h2 className="sr-only">{currentView === "active" ? "進行中の宿題" : "完了した宿題"}</h2>
          {/* モバイル: 明示的な操作ボタン付きカード */}
          <div className="md:hidden space-y-2">
            {visibleHomeworks.map((h) => {
              const overdue = h.dueDate < now && (isPendingStatus(h.status))
              const subjectNames = h.subjectIds.map((sid) => subjectMap.get(sid)).filter(Boolean) as string[]
              return (
                <HomeworkCard
                  key={h.id}
                  id={h.id}
                  title={h.title}
                  studentName={h.student.user.name}
                  status={h.status}
                  dueDate={h.dueDate}
                  subjectNames={subjectNames}
                  isOverdue={overdue}
                />
              )
            })}
          </div>
          {/* デスクトップ: テーブル表示 */}
          <div className="hidden md:block rounded-lg border bg-card overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead className="border-b bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">タイトル</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">生徒</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">期限</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">状態</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {visibleHomeworks.map((h) => {
                  const overdue = h.dueDate < now && (isPendingStatus(h.status))
                  const relLabel = relativeDeadline(h.dueDate)
                  const relColor = deadlineColorClass(h.dueDate)
                  return (
                    <tr key={h.id} className={`hover:bg-muted ${overdue ? "bg-destructive/5" : ""}`}>
                      <td className="px-4 py-3">
                        <Link href={`/homework/${h.id}`} className="font-medium hover:underline">{h.title}</Link>
                        <SubjectTags ids={h.subjectIds} map={subjectMap} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{h.student.user.name}</td>
                      <td className="px-4 py-3">
                        <p className="text-muted-foreground">{formatDate(h.dueDate)}</p>
                        {(isPendingStatus(h.status)) && (
                          <p className={`text-xs ${relColor}`}>{relLabel}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={h.status} />
                      </td>
                      <td className="px-4 py-3">
                        <HomeworkActions homeworkId={h.id} canEdit={isPendingStatus(h.status)} showDetails size="xs" />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {currentView !== "review" && visibleHomeworks.length === 0 && allTotal > 0 && (
        <EmptyState title={currentView === "active" ? "進行中の宿題はありません" : "完了した宿題はありません"} />
      )}

      {allTotal === 0 && (
        <EmptyState
          title={studentIdFilter ? "この生徒の宿題はありません" : "宿題が登録されていません"}
          description={!studentIdFilter ? "最初の宿題を作成しましょう。" : undefined}
          action={!studentIdFilter ? (
            <Link href="/homework/new" className={buttonVariants()}>
              最初の宿題を作成する
            </Link>
          ) : undefined}
        />
      )}

      <PaginationNav
        pathname="/homework"
        page={page}
        total={total}
        pageSize={HOMEWORK_PAGE_SIZE}
        params={{ studentId: studentIdFilter, sort, q, subjects: subjectFilter, view: currentView }}
      />
    </div>
  )
}

async function ParentHomeworkPage({ parentId, studentIdFilter, view, page }: { parentId: string; studentIdFilter?: string; view?: string; page: number }) {
  const links = await getParentHomeworkLinks(parentId)
  if (links.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-12 text-center text-sm text-muted-foreground">
        まだお子様の情報が登録されていません
      </div>
    )
  }

  const allowedStudentIds = links.map((l) => l.studentId)
  const effectiveStudentId = await resolveParentStudentId(allowedStudentIds, studentIdFilter)

  const teacherId = links.find((l) => l.studentId === effectiveStudentId)?.teacherId
  const currentView = view === "waiting" || view === "completed" ? view : "active"
  const [{ homeworks, counts, total, allTotal }, subjects] = await Promise.all([
    getStudentHomeworks(effectiveStudentId, currentView, page),
    teacherId ? getSubjectsByTeacherId(teacherId) : Promise.resolve([]),
  ])
  const subjectMap = buildSubjectMap(subjects)
  const now = new Date()
  const visibleHomeworks = homeworks

  return (
    <div className="space-y-4">
      <PageHeader title="宿題" description="お子さまの提出状況を確認できます。" />
      <ParentStudentSwitcher students={links.map(({ student }) => ({ id: student.id, name: student.user.name }))} selectedStudentId={effectiveStudentId} />

      <HomeworkViewTabs
        current={currentView}
        items={[
          { value: "active", label: "要対応", count: counts.active },
          { value: "waiting", label: "確認中", count: counts.waiting },
          { value: "completed", label: "完了", count: counts.completed },
        ]}
        params={{ studentId: effectiveStudentId }}
      />

      {allTotal === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center text-muted-foreground text-sm">
          宿題はまだありません
        </div>
      ) : visibleHomeworks.length === 0 ? (
        <EmptyState title="該当する宿題はありません" />
      ) : (
        <div className="space-y-2">
          {visibleHomeworks.map((h) => {
            const overdue = h.dueDate < now && (isPendingStatus(h.status))
            const relLabel = relativeDeadline(h.dueDate)
            const relColor = deadlineColorClass(h.dueDate)
            return (
              <Link
                key={h.id}
                href={`/homework/${h.id}`}
                className={`block rounded-lg border bg-card p-4 hover:bg-muted active:bg-muted transition-colors ${overdue ? "border-destructive/30 bg-destructive/5" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{h.title}</p>
                    <SubjectTags ids={h.subjectIds} map={subjectMap} />
                  </div>
                  <StatusBadge status={h.status} />
                </div>
                <p className={`text-xs mt-1.5 ${isPendingStatus(h.status) ? relColor : "text-muted-foreground"}`}>
                  期限: {formatDate(h.dueDate)}
                  {(isPendingStatus(h.status)) && <span className="ml-1.5">（{relLabel}）</span>}
                </p>
              </Link>
            )
          })}
        </div>
      )}
      <PaginationNav pathname="/homework" page={page} total={total} pageSize={HOMEWORK_PAGE_SIZE} params={{ studentId: effectiveStudentId, view: currentView }} />
    </div>
  )
}

async function StudentHomeworkPage({ userId, view, page }: { userId: string; view?: string; page: number }) {
  const student = await getStudentByUserId(userId)
  if (!student) redirect("/dashboard")

  const currentView = view === "waiting" || view === "completed" ? view : "active"
  const [{ homeworks, counts, total, allTotal }, subjects] = await Promise.all([
    getStudentHomeworks(student.id, currentView, page),
    getSubjectsByTeacherId(student.teacherId),
  ])

  const subjectMap = buildSubjectMap(subjects)
  const now = new Date()
  const active = currentView === "active" ? homeworks : []
  const submitted = currentView === "waiting" ? homeworks : []
  const approvedAll = currentView === "completed" ? homeworks : []

  return (
    <div className="space-y-4">
      <PageHeader title="宿題" description="今取り組む宿題を優先して表示します。" />
      <HomeworkViewTabs
        current={currentView}
        items={[
          { value: "active", label: "要対応", count: counts.active },
          { value: "waiting", label: "確認中", count: counts.waiting },
          { value: "completed", label: "完了", count: counts.completed },
        ]}
      />

      {currentView === "active" && active.length > 0 && (
        <section className="space-y-3">
          <h2 className="sr-only">要対応の宿題</h2>
          <div className="space-y-2">
            {active.map((h) => {
              const overdue = h.dueDate < now
              const relLabel = relativeDeadline(h.dueDate)
              const relColor = deadlineColorClass(h.dueDate)
              return (
                <div
                  key={h.id}
                  className={`rounded-lg border bg-card p-4 flex items-start justify-between gap-4 ${overdue ? "border-destructive/30" : ""}`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate">{h.title}</p>
                    </div>
                    <p className={`text-sm mt-0.5 ${relColor}`}>
                      期限: {formatDate(h.dueDate)}
                      <span className="ml-1.5 text-xs">（{relLabel}）</span>
                    </p>
                    <SubjectTags ids={h.subjectIds} map={subjectMap} />
                    {h.status === "rejected" && h.teacherFeedback && (
                      <p className="text-sm text-destructive mt-2 border-l-2 border-destructive/30 pl-3 whitespace-pre-wrap">
                        先生のコメント: {h.teacherFeedback}
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/homework/${h.id}/submit`}
                    className={buttonVariants({ size: "sm", className: "shrink-0" })}
                  >
                    提出する
                  </Link>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {currentView === "waiting" && submitted.length > 0 && (
        <section className="space-y-3">
          <h2 className="sr-only">先生が確認中の宿題</h2>
          <div className="space-y-2">
            {submitted.map((h) => (
              <div key={h.id} className="rounded-lg border bg-card p-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium truncate">{h.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    提出済み {h.submittedAt && formatDate(h.submittedAt)}
                  </p>
                  <SubjectTags ids={h.subjectIds} map={subjectMap} />
                </div>
                <Link href={`/homework/${h.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>詳細</Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {currentView === "completed" && approvedAll.length > 0 && (
        <section className="space-y-3">
          <h2 className="sr-only">完了した宿題</h2>
          <div className="space-y-2">
            {approvedAll.map((h) => {
              const unseenFeedback = !!h.teacherFeedback && h.feedbackSeenAt === null
              return (
                <Link
                  key={h.id}
                  href={`/homework/${h.id}`}
                  className={`block rounded-lg border p-4 transition-colors ${
                    unseenFeedback
                      ? "border-primary/30 bg-primary/5 hover:bg-primary/10"
                      : "bg-card hover:bg-muted active:bg-muted opacity-75"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{h.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        期限: {formatDate(h.dueDate)}
                      </p>
                      <SubjectTags ids={h.subjectIds} map={subjectMap} />
                    </div>
                    <span className="shrink-0 flex items-center gap-1.5">
                      {unseenFeedback && <UnreadBadge />}
                      <StatusBadge status={h.status} />
                    </span>
                  </div>
                  {h.teacherFeedback && (
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed border-l-2 border-primary/30 pl-3 whitespace-pre-wrap line-clamp-2">
                      先生のコメント: {h.teacherFeedback}
                    </p>
                  )}
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {allTotal > 0 && (
        (currentView === "active" && active.length === 0) ||
        (currentView === "waiting" && submitted.length === 0) ||
        (currentView === "completed" && approvedAll.length === 0)
      ) && <EmptyState title="該当する宿題はありません" />}

      {allTotal === 0 && (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">宿題はまだありません</p>
        </div>
      )}
      <PaginationNav pathname="/homework" page={page} total={total} pageSize={HOMEWORK_PAGE_SIZE} params={{ view: currentView }} />
    </div>
  )
}

async function getTeacherHomeworks(
  teacherId: string,
  studentIdFilter?: string,
  sort?: string,
  query?: string,
  subjectFilter?: string,
  view?: string,
  page = 1
) {
  "use cache"
  cacheLife(cacheProfiles.active)
  cacheTag(cacheTags.teacherHomework(teacherId))

  const subjectIds = subjectFilter?.split(",").filter(Boolean) ?? []
  const orderBy = sort === "due" ? { dueDate: "asc" as const } : { createdAt: "desc" as const }

  const baseWhere = {
    teacherId,
    ...(studentIdFilter ? { studentId: studentIdFilter } : {}),
    ...(query ? { title: { contains: query, mode: "insensitive" as const } } : {}),
    ...(subjectIds.length > 0
      ? {
          OR: [
            { subjectIds: { hasSome: subjectIds } },
            { material: { is: { subjectIds: { hasSome: subjectIds } } } },
          ],
        }
      : {}),
  }
  const grouped = await db.homework.groupBy({ by: ["status"], where: baseWhere, _count: { _all: true } })
  const countFor = (status: string) => grouped.find((row) => row.status === status)?._count._all ?? 0
  const counts = {
    review: countFor("submitted"),
    active: countFor("assigned") + countFor("rejected"),
    completed: countFor("approved"),
  }
  const currentView = view === "active" || view === "completed" || view === "review"
    ? view
    : counts.review > 0 ? "review" : "active"
  const statuses = currentView === "review"
    ? ["submitted" as const]
    : currentView === "active"
      ? ["assigned" as const, "rejected" as const]
      : ["approved" as const]
  const homeworks = await db.homework.findMany({
    where: { ...baseWhere, status: { in: statuses } },
    include: { student: { include: { user: { select: { name: true } } } } },
    orderBy,
    take: HOMEWORK_PAGE_SIZE,
    skip: (page - 1) * HOMEWORK_PAGE_SIZE,
  })
  const total = currentView === "review" ? counts.review : currentView === "active" ? counts.active : counts.completed
  return { homeworks, counts, currentView, total, allTotal: counts.review + counts.active + counts.completed }
}

async function getTeacherHomeworkStudents(teacherId: string) {
  "use cache"
  cacheLife(cacheProfiles.reference)
  cacheTag(cacheTags.teacherStudents(teacherId))
  return db.student.findMany({
    where: { teacherId },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  })
}

async function getParentHomeworkLinks(parentId: string) {
  "use cache"
  cacheLife(cacheProfiles.reference)
  cacheTag(cacheTags.parentStudents(parentId))
  return db.parentStudent.findMany({
    where: { parentId },
    include: { student: { include: { user: { select: { name: true } } } } },
  })
}

async function getStudentHomeworks(studentId: string, view: "active" | "waiting" | "completed", page = 1) {
  "use cache"
  cacheLife(cacheProfiles.active)
  cacheTag(cacheTags.studentHomework(studentId))
  const grouped = await db.homework.groupBy({ by: ["status"], where: { studentId }, _count: { _all: true } })
  const countFor = (status: string) => grouped.find((row) => row.status === status)?._count._all ?? 0
  const counts = {
    active: countFor("assigned") + countFor("rejected"),
    waiting: countFor("submitted"),
    completed: countFor("approved"),
  }
  const statuses = view === "active"
    ? ["assigned" as const, "rejected" as const]
    : view === "waiting"
      ? ["submitted" as const]
      : ["approved" as const]
  const total = view === "active" ? counts.active : view === "waiting" ? counts.waiting : counts.completed
  const homeworks = await db.homework.findMany({
    where: { studentId, status: { in: statuses } },
    orderBy: view === "completed" ? { reviewedAt: "desc" } : { dueDate: "asc" },
    take: HOMEWORK_PAGE_SIZE,
    skip: (page - 1) * HOMEWORK_PAGE_SIZE,
  })
  return { homeworks, counts, total, allTotal: counts.active + counts.waiting + counts.completed }
}
