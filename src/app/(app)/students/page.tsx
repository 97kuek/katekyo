import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { StudentSort } from "./student-sort"
import { StudentRow } from "./student-row"

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

  const [students, homeworkStats] = await Promise.all([
    db.student.findMany({
      where: { teacherId: session.user.id },
      include: { user: { select: { name: true, email: true } } },
      orderBy,
    }),
    db.homework.groupBy({
      by: ["studentId", "status"],
      where: { teacherId: session.user.id },
      _count: { status: true },
    }),
  ])

  const progressMap = new Map<string, { total: number; approved: number }>()
  for (const row of homeworkStats) {
    const entry = progressMap.get(row.studentId) ?? { total: 0, approved: 0 }
    entry.total += row._count.status
    if (row.status === "approved") entry.approved += row._count.status
    progressMap.set(row.studentId, entry)
  }

  const sortedStudents = sort === "progress"
    ? [...students].sort((a, b) => {
        const pa = progressMap.get(a.id)
        const pb = progressMap.get(b.id)
        const ra = pa && pa.total > 0 ? pa.approved / pa.total : -1
        const rb = pb && pb.total > 0 ? pb.approved / pb.total : -1
        return rb - ra
      })
    : students

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <StudentSort />
        <div className="flex items-center gap-2">
          <Link href="/students/invites" className={buttonVariants({ variant: "outline", size: "sm" })}>
            招待管理
          </Link>
          <Link href="/students/invite" className={buttonVariants({ size: "sm" })}>
            招待リンクを作成
          </Link>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{students.length}名の生徒</p>

      {students.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">まだ生徒が登録されていません</p>
          <Link href="/students/invite" className={buttonVariants({ className: "mt-4 inline-flex" })}>
            最初の生徒を招待する
          </Link>
        </div>
      ) : (
        <>
          {/* モバイル: カード表示 */}
          <div className="md:hidden space-y-3">
            {sortedStudents.map((s) => {
              const prog = progressMap.get(s.id)
              const pct = prog && prog.total > 0 ? Math.round((prog.approved / prog.total) * 100) : null
              return (
                <Link
                  key={s.id}
                  href={`/students/${s.id}`}
                  className="block rounded-lg border bg-card p-3 space-y-2 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex items-baseline gap-2">
                      <p className="font-medium truncate">{s.user.name}</p>
                      <p className="text-xs text-muted-foreground shrink-0">{s.grade}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                  {pct != null && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>宿題進捗</span>
                        <span>{prog!.approved}/{prog!.total}（{pct}%）</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
          {/* デスクトップ: テーブル表示（行クリックで詳細へ） */}
          <div className="hidden md:block rounded-lg border bg-card overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead className="border-b bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">名前</th>
                  <th className="hidden lg:table-cell px-4 py-3 text-left font-medium text-muted-foreground">メールアドレス</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">学年</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">宿題進捗</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">登録日</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sortedStudents.map((s) => {
                  const prog = progressMap.get(s.id)
                  const pct = prog && prog.total > 0 ? Math.round((prog.approved / prog.total) * 100) : null
                  return (
                    <StudentRow key={s.id} href={`/students/${s.id}`}>
                      <td className="px-4 py-3 font-medium">{s.user.name}</td>
                      <td className="hidden lg:table-cell px-4 py-3 text-muted-foreground">{s.user.email}</td>
                      <td className="px-4 py-3">{s.grade}</td>
                      <td className="px-4 py-3">
                        {pct != null ? (
                          <div className="space-y-1 min-w-[80px]">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{prog!.approved}/{prog!.total}</span>
                              <span>{pct}%</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{s.createdAt.toLocaleDateString("ja-JP")}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <ChevronRight className="h-4 w-4" />
                      </td>
                    </StudentRow>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
