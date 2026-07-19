import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { StudentSort } from "./student-sort"
import { StudentSplitView } from "./student-split-view"
import { PageHeader } from "@/components/ui/page-header"
import { cacheLife, cacheTag } from "next/cache"
import { cacheProfiles } from "@/lib/cache-policy"
import { cacheTags } from "@/lib/cache-tags"

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>
}) {
  const session = await auth()
  if (!session || session.user.role !== "teacher") redirect("/dashboard")

  const { sort } = await searchParams

  const students = await getStudentsWithSignals(session.user.id, sort)

  return (
    <div className="space-y-4">
      <PageHeader
        title="生徒"
        description={`${students.length}名の生徒を管理しています。`}
        action={<Link href="/students/invite" className={buttonVariants({ size: "sm" })}>生徒を招待</Link>}
        secondaryAction={<Link href="/students/invites" className={buttonVariants({ variant: "ghost", size: "sm", className: "hidden sm:inline-flex" })}>招待管理</Link>}
      />
      <div className="flex justify-end"><StudentSort /></div>

      {students.length === 0 ? (
        <EmptyState title="生徒が登録されていません" description="招待リンクを作成して最初の生徒を登録しましょう。" action={(
          <Link href="/students/invite" className={buttonVariants()}>
            最初の生徒を招待する
          </Link>
        )} />
      ) : (
        <>
          {/* モバイル: カード表示 */}
          <div className="md:hidden space-y-3">
            {students.map((s) => (
              <Link
                key={s.id}
                href={`/students/${s.id}`}
                className="apple-card-surface apple-interactive-card flex items-center justify-between gap-2 rounded-2xl p-3.5"
              >
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2"><p className="font-medium truncate">{s.user.name}</p><p className="text-xs text-muted-foreground shrink-0">{s.grade}</p></div>
                  <StudentSignal homeworks={s.homeworks} nextLesson={s.lessons[0]?.date} />
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </Link>
            ))}
          </div>
          <StudentSplitView
            students={students.map((student) => {
              const reviewCount = student.homeworks.filter((homework) => homework.status === "submitted").length
              return {
                id: student.id,
                name: student.user.name,
                email: student.user.email,
                grade: student.grade,
                reviewCount,
                problemCount: student.homeworks.length - reviewCount,
                nextLesson: student.lessons[0]?.date.toISOString() ?? null,
              }
            })}
          />
        </>
      )}
    </div>
  )
}

async function getStudentsWithSignals(teacherId: string, sort?: string) {
  "use cache"
  cacheLife(cacheProfiles.active)
  cacheTag(cacheTags.teacherStudents(teacherId), cacheTags.teacherHomework(teacherId), cacheTags.teacherCalendar(teacherId))

  const orderBy =
    sort === "name" ? { user: { name: "asc" as const } } :
    sort === "grade" ? { grade: "asc" as const } :
    { createdAt: "desc" as const }
  const now = new Date()

  return db.student.findMany({
    where: { teacherId },
    include: {
      user: { select: { name: true, email: true } },
      homeworks: {
        where: {
          OR: [
            { status: "submitted" },
            { status: "rejected" },
            { status: "assigned", dueDate: { lt: now } },
          ],
        },
        select: { id: true, status: true },
      },
      lessons: {
        where: { date: { gte: now } },
        orderBy: { date: "asc" },
        take: 1,
        select: { date: true },
      },
    },
    orderBy,
  })
}

function StudentSignal({
  homeworks,
  nextLesson,
}: {
  homeworks: Array<{ id: string; status: string }>
  nextLesson?: Date
}) {
  const review = homeworks.filter((homework) => homework.status === "submitted").length
  const problem = homeworks.length - review
  if (review > 0) return <p className="mt-1 text-xs font-medium text-primary">確認待ち {review}件</p>
  if (problem > 0) return <p className="mt-1 text-xs font-medium text-destructive">要対応 {problem}件</p>
  if (nextLesson) {
    return <p className="mt-1 text-xs text-muted-foreground">次回 {nextLesson.toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo", month: "numeric", day: "numeric" })}</p>
  }
  return <p className="mt-1 text-xs text-muted-foreground">要対応なし</p>
}
