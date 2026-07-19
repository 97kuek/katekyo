import { redirect } from "next/navigation"
import { getViewingContext } from "@/lib/view-as"
import { db } from "@/lib/db"
import { getStudentByUserId, getSubjectsByTeacherId, buildSubjectMap } from "@/lib/queries"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { StatusBadge } from "@/components/homework/status-badge"
import { UnreadBadge } from "@/components/ui/unread-badge"
import { CancelSubmissionButton } from "./cancel-button"
import { HomeworkFilter } from "./homework-filter"
import { BulkApproveSection } from "./bulk-approve-section"
import { relativeDeadline, deadlineColorClass, formatDate } from "@/lib/date-utils"
import { isPendingStatus } from "@/lib/homework-status"
import { SubjectTags } from "@/components/ui/subject-tags"
import { SwipeableHomeworkCard } from "./swipeable-card"
import { EmptyState } from "@/components/ui/empty-state"

export default async function HomeworkPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string; sort?: string; q?: string; subjects?: string }>
}) {
  const ctx = await getViewingContext()
  if (!ctx) redirect("/login")

  const { studentId, sort, q, subjects } = await searchParams

  if (ctx.effectiveRole === "teacher") {
    return <TeacherHomeworkPage teacherId={ctx.effectiveUserId} studentIdFilter={studentId} sort={sort} q={q} subjectFilter={subjects} />
  }
  if (ctx.effectiveRole === "parent") {
    return <ParentHomeworkPage parentId={ctx.effectiveUserId} studentIdFilter={studentId} />
  }
  return <StudentHomeworkPage userId={ctx.effectiveUserId} />
}

async function TeacherHomeworkPage({
  teacherId,
  studentIdFilter,
  sort,
  q,
  subjectFilter,
}: {
  teacherId: string
  studentIdFilter?: string
  sort?: string
  q?: string
  subjectFilter?: string
}) {
  const subjectIds = subjectFilter?.split(",").filter(Boolean) ?? []
  const orderBy = sort === "due" ? { dueDate: "asc" as const } : { createdAt: "desc" as const }

  // 科目タグで絞り込む場合、教材経由でマッチする materialId も対象に含める
  const matchingMaterialIds: string[] = []
  if (subjectIds.length > 0) {
    const mats = await db.studentMaterial.findMany({
      where: { teacherId, subjectIds: { hasSome: subjectIds } },
      select: { id: true },
    })
    matchingMaterialIds.push(...mats.map((m) => m.id))
  }

  const subjectWhere =
    subjectIds.length > 0
      ? {
          OR: [
            { subjectIds: { hasSome: subjectIds } },
            ...(matchingMaterialIds.length > 0 ? [{ materialId: { in: matchingMaterialIds } }] : []),
          ],
        }
      : {}

  const [homeworks, subjects, students] = await Promise.all([
    db.homework.findMany({
      where: {
        teacherId,
        ...(studentIdFilter ? { studentId: studentIdFilter } : {}),
        ...(q ? { title: { contains: q, mode: "insensitive" as const } } : {}),
        ...subjectWhere,
      },
      include: { student: { include: { user: { select: { name: true } } } } },
      orderBy,
    }),
    getSubjectsByTeacherId(teacherId),
    db.student.findMany({
      where: { teacherId },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ])

  const subjectMap = buildSubjectMap(subjects)
  const now = new Date()
  const submitted = homeworks.filter((h) => h.status === "submitted")
  const others = homeworks.filter((h) => h.status !== "submitted")

  return (
    <div className="space-y-4">
      <HomeworkFilter students={students} subjects={subjects}>
        <Link href="/homework/new" className={buttonVariants({ size: "sm", className: "gap-1.5 shrink-0" })}>
          <Plus className="h-4 w-4 shrink-0" />
          宿題を作成
        </Link>
      </HomeworkFilter>

      {submitted.length > 0 && (
        <BulkApproveSection submitted={submitted} subjectMap={subjectMap} />
      )}

      {others.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">すべての宿題</h2>
          {/* モバイル: スワイプカード */}
          <div className="md:hidden space-y-2">
            {others.map((h) => {
              const overdue = h.dueDate < now && (isPendingStatus(h.status))
              const subjectNames = h.subjectIds.map((sid) => subjectMap.get(sid)).filter(Boolean) as string[]
              return (
                <SwipeableHomeworkCard
                  key={h.id}
                  id={h.id}
                  title={h.title}
                  studentName={h.student.user.name}
                  status={h.status}
                  dueDateStr={h.dueDate.toISOString()}
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
                </tr>
              </thead>
              <tbody className="divide-y">
                {others.map((h) => {
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
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {homeworks.length === 0 && (
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
    </div>
  )
}

async function ParentHomeworkPage({ parentId, studentIdFilter }: { parentId: string; studentIdFilter?: string }) {
  const links = await db.parentStudent.findMany({
    where: { parentId },
    include: { student: { include: { user: { select: { name: true } } } } },
  })
  if (links.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-12 text-center text-sm text-muted-foreground">
        まだお子様の情報が登録されていません
      </div>
    )
  }

  const allowedStudentIds = links.map((l) => l.studentId)
  const effectiveStudentId = studentIdFilter && allowedStudentIds.includes(studentIdFilter)
    ? studentIdFilter
    : allowedStudentIds[0]

  const homeworks = await db.homework.findMany({
    where: { studentId: effectiveStudentId },
    orderBy: { dueDate: "asc" },
  })

  const teacherId = links.find((l) => l.studentId === effectiveStudentId)?.teacherId
  const subjects = teacherId ? await getSubjectsByTeacherId(teacherId) : []
  const subjectMap = buildSubjectMap(subjects)
  const now = new Date()

  return (
    <div className="space-y-4">
      {links.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          {links.map(({ student }) => (
            <a
              key={student.id}
              href={`/homework?studentId=${student.id}`}
              className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                student.id === effectiveStudentId
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:bg-muted"
              }`}
            >
              {student.user.name}
            </a>
          ))}
        </div>
      )}

      {homeworks.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center text-muted-foreground text-sm">
          宿題はまだありません
        </div>
      ) : (
        <div className="space-y-2">
          {homeworks.map((h) => {
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
    </div>
  )
}

async function StudentHomeworkPage({ userId }: { userId: string }) {
  const student = await getStudentByUserId(userId)
  if (!student) redirect("/dashboard")

  const [homeworks, subjects] = await Promise.all([
    db.homework.findMany({ where: { studentId: student.id }, orderBy: { dueDate: "asc" } }),
    getSubjectsByTeacherId(student.teacherId),
  ])

  const subjectMap = buildSubjectMap(subjects)
  const now = new Date()
  const active = homeworks.filter((h) => isPendingStatus(h.status))
  const submitted = homeworks.filter((h) => h.status === "submitted")
  const approvedAll = homeworks.filter((h) => h.status === "approved")
  const approved = approvedAll.slice(0, 5)
  const approvedRemainder = approvedAll.length - approved.length

  return (
    <div className="space-y-4">
      {active.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">やること</h2>
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
                      <StatusBadge status={h.status} />
                    </div>
                    <p className={`text-sm mt-0.5 ${relColor}`}>
                      期限: {formatDate(h.dueDate)}
                      <span className="ml-1.5 text-xs">（{relLabel}）</span>
                    </p>
                    <SubjectTags ids={h.subjectIds} map={subjectMap} />
                    {h.description && (
                      <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap line-clamp-2">{h.description}</p>
                    )}
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

      {submitted.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">承認待ち（{submitted.length}件）</h2>
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
                <CancelSubmissionButton homeworkId={h.id} />
              </div>
            ))}
          </div>
        </section>
      )}

      {approved.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">完了（{approvedAll.length}件）</h2>
          <div className="space-y-2">
            {approved.map((h) => {
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
            {approvedRemainder > 0 && (
              <p className="py-1 text-center text-xs text-muted-foreground">他 {approvedRemainder} 件</p>
            )}
          </div>
        </section>
      )}

      {homeworks.length === 0 && (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">宿題はまだありません</p>
        </div>
      )}
    </div>
  )
}
