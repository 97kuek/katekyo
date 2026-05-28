import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { DeleteStudentButton } from "./delete-student-button"
import { UpdateGradeForm } from "./update-grade-form"
import { UpdateStudentRatesForm } from "./update-student-rates-form"
import { StudentSort } from "./student-sort"
import { ResetPasswordButton } from "./reset-password-button"
import { ViewAsButton } from "./view-as-button"

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>
}) {
  const session = await auth()
  if (!session || session.user.role !== "teacher") redirect("/dashboard")

  const { sort } = await searchParams
  const now = new Date()

  const orderBy =
    sort === "name" ? { user: { name: "asc" as const } } :
    sort === "grade" ? { grade: "asc" as const } :
    { createdAt: "desc" as const }

  const [students, homeworkStats, subjects] = await Promise.all([
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
    db.subject.findMany({
      where: { teacherId: session.user.id },
      orderBy: { name: "asc" },
    }),
  ])

  const studentIds = students.map(s => s.id)

  const [gardenStats, problemStats] = studentIds.length === 0 ? [[], []] : await Promise.all([
    db.gardenItem.groupBy({
      by: ["studentId"],
      where: { studentId: { in: studentIds } },
      _count: { _all: true },
    }),
    db.homework.groupBy({
      by: ["studentId"],
      where: {
        teacherId: session.user.id,
        OR: [
          { status: "assigned", dueDate: { lt: now } },
          { status: "rejected" },
        ],
      },
      _count: { _all: true },
    }),
  ])

  const progressMap = new Map<string, { total: number; approved: number }>()
  for (const row of homeworkStats) {
    const entry = progressMap.get(row.studentId) ?? { total: 0, approved: 0 }
    entry.total += row._count.status
    if (row.status === "approved") entry.approved += row._count.status
    progressMap.set(row.studentId, entry)
  }

  const gardenMap = new Map<string, number>(
    (gardenStats as { studentId: string; _count: { _all: number } }[]).map(g => [g.studentId, g._count._all])
  )
  const problemMap = new Map<string, number>(
    (problemStats as { studentId: string; _count: { _all: number } }[]).map(p => [p.studentId, p._count._all])
  )

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
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">生徒一覧</h1>
        <p className="text-sm text-muted-foreground mt-1">{students.length}名の生徒が登録されています</p>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
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
              const gardenCount = gardenMap.get(s.id) ?? 0
              const problemCount = problemMap.get(s.id) ?? 0
              const isFull = gardenCount >= 64
              const isWithered = problemCount > 0 && gardenCount > 0
              return (
                <div key={s.id} className="rounded-lg border bg-card p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{s.user.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.grade}</p>
                      <p className="text-xs text-muted-foreground">{s.user.email}</p>
                    </div>
                    <UpdateGradeForm studentId={s.id} currentGrade={s.grade} />
                  </div>
                  <UpdateStudentRatesForm
                    studentId={s.id}
                    defaultHourlyRate={s.defaultHourlyRate}
                    defaultTravelExpense={s.defaultTravelExpense}
                    defaultDurationMin={s.defaultDurationMin}
                    defaultSubjectIds={s.defaultSubjectIds}
                    subjects={subjects.map((sub) => ({ id: sub.id, name: sub.name }))}
                  />
                  {pct != null && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>宿題進捗</span>
                        <span>{prog!.approved}/{prog!.total}（{pct}%）</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 pt-1 border-t flex-wrap">
                    <ViewAsButton studentId={s.id} />
                    <Link href={`/students/${s.id}/grades`} className={buttonVariants({ variant: "ghost", size: "xs" })}>
                      成績を見る
                    </Link>
                    <Link href={`/students/${s.id}/materials`} className={buttonVariants({ variant: "ghost", size: "xs" })}>
                      教材管理
                    </Link>
                    <div className="flex items-center gap-1">
                      <Link href={`/students/${s.id}/garden`} className={buttonVariants({ variant: "ghost", size: "xs" })}>
                        森を見る
                      </Link>
                      {isFull ? (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-1 rounded">満開</span>
                      ) : isWithered ? (
                        <span className="inline-block h-2 w-2 rounded-full bg-amber-400 shrink-0" />
                      ) : gardenCount > 0 ? (
                        <span className="inline-block h-2 w-2 rounded-full bg-green-400 shrink-0" />
                      ) : null}
                    </div>
                    <ResetPasswordButton studentId={s.id} />
                    <DeleteStudentButton studentId={s.id} studentName={s.user.name} />
                  </div>
                </div>
              )
            })}
          </div>
          {/* デスクトップ: テーブル表示 */}
          <div className="hidden md:block rounded-lg border bg-card overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead className="border-b bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">名前</th>
                  <th className="hidden lg:table-cell px-4 py-3 text-left font-medium text-muted-foreground">メールアドレス</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">学年</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">宿題進捗</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">登録日</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sortedStudents.map((s) => {
                  const prog = progressMap.get(s.id)
                  const pct = prog && prog.total > 0 ? Math.round((prog.approved / prog.total) * 100) : null
                  const gardenCount = gardenMap.get(s.id) ?? 0
                  const problemCount = problemMap.get(s.id) ?? 0
                  const isFull = gardenCount >= 64
                  const isWithered = problemCount > 0 && gardenCount > 0
                  return (
                    <tr key={s.id} className="hover:bg-muted">
                      <td className="px-4 py-3 font-medium">{s.user.name}</td>
                      <td className="hidden lg:table-cell px-4 py-3 text-muted-foreground">{s.user.email}</td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <span className="text-sm">{s.grade}</span>
                          <UpdateGradeForm studentId={s.id} currentGrade={s.grade} />
                          <UpdateStudentRatesForm
                            studentId={s.id}
                            defaultHourlyRate={s.defaultHourlyRate}
                            defaultTravelExpense={s.defaultTravelExpense}
                            defaultDurationMin={s.defaultDurationMin}
                            defaultSubjectIds={s.defaultSubjectIds}
                            subjects={subjects.map((sub) => ({ id: sub.id, name: sub.name }))}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {pct != null ? (
                          <div className="space-y-1 min-w-[80px]">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{prog!.approved}/{prog!.total}</span>
                              <span>{pct}%</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{s.createdAt.toLocaleDateString("ja-JP")}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-3 flex-wrap">
                          <ViewAsButton studentId={s.id} />
                          <Link href={`/students/${s.id}/grades`} className={buttonVariants({ variant: "ghost", size: "xs" })}>
                            成績を見る
                          </Link>
                          <Link href={`/students/${s.id}/materials`} className={buttonVariants({ variant: "ghost", size: "xs" })}>
                            教材管理
                          </Link>
                          <div className="flex items-center gap-1">
                            <Link href={`/students/${s.id}/garden`} className={buttonVariants({ variant: "ghost", size: "xs" })}>
                              森を見る
                            </Link>
                            {isFull ? (
                              <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-1 rounded">満開</span>
                            ) : isWithered ? (
                              <span className="inline-block h-2 w-2 rounded-full bg-amber-400 shrink-0" />
                            ) : gardenCount > 0 ? (
                              <span className="inline-block h-2 w-2 rounded-full bg-green-400 shrink-0" />
                            ) : null}
                          </div>
                          <ResetPasswordButton studentId={s.id} />
                          <DeleteStudentButton studentId={s.id} studentName={s.user.name} />
                        </div>
                      </td>
                    </tr>
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
