import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { StudentSort } from "./student-sort"
import { StudentRow } from "./student-row"
import { PageHeader } from "@/components/ui/page-header"

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>
}) {
  const session = await auth()
  if (!session || session.user.role !== "teacher") redirect("/dashboard")

  const { sort } = await searchParams

  const orderBy =
    sort === "name" ? { user: { name: "asc" as const } } :
    sort === "grade" ? { grade: "asc" as const } :
    { createdAt: "desc" as const }

  const now = new Date()
  const students = await db.student.findMany({
    where: { teacherId: session.user.id },
    include: {
      user: { select: { name: true } },
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
                className="flex items-center justify-between gap-2 rounded-lg border bg-card p-3.5 hover:bg-muted transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2"><p className="font-medium truncate">{s.user.name}</p><p className="text-xs text-muted-foreground shrink-0">{s.grade}</p></div>
                  <StudentSignal homeworks={s.homeworks} nextLesson={s.lessons[0]?.date} />
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </Link>
            ))}
          </div>
          {/* デスクトップ: テーブル表示（行クリックで詳細へ） */}
          <div className="hidden md:block rounded-lg border bg-card overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">名前</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">学年</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">状況</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {students.map((s) => (
                  <StudentRow key={s.id} href={`/students/${s.id}`}>
                    <td className="px-4 py-3 font-medium">{s.user.name}</td>
                    <td className="px-4 py-3">{s.grade}</td>
                    <td className="px-4 py-3"><StudentSignal homeworks={s.homeworks} nextLesson={s.lessons[0]?.date} /></td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <ChevronRight className="h-4 w-4" />
                    </td>
                  </StudentRow>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
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
