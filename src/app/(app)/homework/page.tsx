import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { StatusBadge } from "@/components/homework/status-badge"

function SubjectTags({ ids, map }: { ids: string[]; map: Map<string, string> }) {
  const names = ids.map((id) => map.get(id)).filter(Boolean) as string[]
  if (names.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {names.map((name) => (
        <span key={name} className="text-xs bg-blue-50 text-blue-700 rounded-full px-2 py-0.5">
          {name}
        </span>
      ))}
    </div>
  )
}

function OverdueBadge() {
  return (
    <span className="text-xs bg-red-100 text-red-700 rounded-full px-2 py-0.5 font-medium">
      期限切れ
    </span>
  )
}

export default async function HomeworkPage() {
  const session = await auth()
  if (!session) redirect("/login")

  if (session.user.role === "teacher") {
    return <TeacherHomeworkPage teacherId={session.user.id} />
  }
  return <StudentHomeworkPage userId={session.user.id} />
}

async function TeacherHomeworkPage({ teacherId }: { teacherId: string }) {
  const [homeworks, subjects] = await Promise.all([
    db.homework.findMany({
      where: { teacherId },
      include: { student: { include: { user: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
    }),
    db.subject.findMany({ where: { teacherId }, select: { id: true, name: true } }),
  ])

  const subjectMap = new Map(subjects.map((s) => [s.id, s.name]))
  const now = new Date()
  const submitted = homeworks.filter((h) => h.status === "submitted")
  const others = homeworks.filter((h) => h.status !== "submitted")

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold">宿題管理</h1>
        <Link href="/homework/new" className={buttonVariants()}>
          宿題を作成
        </Link>
      </div>

      {submitted.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-yellow-800 bg-yellow-50 px-3 py-1.5 rounded-md inline-flex items-center gap-1.5">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-yellow-600 text-white text-xs">
              {submitted.length}
            </span>
            承認待ち
          </h2>
          <div className="space-y-2">
            {submitted.map((h) => (
              <div key={h.id} className="rounded-lg border bg-white p-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium truncate">{h.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{h.student.user.name}</p>
                  <SubjectTags ids={h.subjectIds} map={subjectMap} />
                  {h.studentNote && (
                    <p className="text-sm text-gray-600 mt-2 border-l-2 pl-3">{h.studentNote}</p>
                  )}
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

      {others.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">すべての宿題</h2>
          <div className="rounded-lg border bg-white overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">タイトル</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">生徒</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">期限</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">状態</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {others.map((h) => {
                  const overdue = h.dueDate < now && h.status === "assigned"
                  return (
                    <tr key={h.id} className={`hover:bg-gray-50 ${overdue ? "bg-red-50/40" : ""}`}>
                      <td className="px-4 py-3">
                        <Link href={`/homework/${h.id}`} className="font-medium hover:underline">{h.title}</Link>
                        <SubjectTags ids={h.subjectIds} map={subjectMap} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{h.student.user.name}</td>
                      <td className="px-4 py-3">
                        <span className={overdue ? "text-red-600 font-medium" : "text-muted-foreground"}>
                          {h.dueDate.toLocaleDateString("ja-JP")}
                        </span>
                        {overdue && <span className="block text-xs text-red-500">期限切れ</span>}
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
        <div className="rounded-lg border bg-white p-12 text-center">
          <p className="text-muted-foreground">まだ宿題が登録されていません</p>
          <Link href="/homework/new" className={buttonVariants({ className: "mt-4 inline-flex" })}>
            最初の宿題を作成する
          </Link>
        </div>
      )}
    </div>
  )
}

async function StudentHomeworkPage({ userId }: { userId: string }) {
  const student = await db.student.findUnique({ where: { userId } })
  if (!student) redirect("/dashboard")

  const [homeworks, subjects] = await Promise.all([
    db.homework.findMany({ where: { studentId: student.id }, orderBy: { dueDate: "asc" } }),
    db.subject.findMany({ where: { teacherId: student.teacherId }, select: { id: true, name: true } }),
  ])

  const subjectMap = new Map(subjects.map((s) => [s.id, s.name]))
  const now = new Date()
  const active = homeworks.filter((h) => h.status === "assigned" || h.status === "rejected")
  const done = homeworks.filter((h) => h.status === "submitted" || h.status === "approved")

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">宿題</h1>

      {active.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">やること</h2>
          <div className="space-y-2">
            {active.map((h) => {
              const overdue = h.dueDate < now
              return (
                <div
                  key={h.id}
                  className={`rounded-lg border bg-white p-4 flex items-start justify-between gap-4 ${overdue ? "border-red-200" : ""}`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate">{h.title}</p>
                      <StatusBadge status={h.status} />
                      {overdue && <OverdueBadge />}
                    </div>
                    <p className={`text-sm mt-0.5 ${overdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                      期限: {h.dueDate.toLocaleDateString("ja-JP")}
                    </p>
                    <SubjectTags ids={h.subjectIds} map={subjectMap} />
                    {h.description && (
                      <p className="text-sm text-gray-600 mt-1">{h.description}</p>
                    )}
                    {h.status === "rejected" && h.teacherFeedback && (
                      <p className="text-sm text-red-600 mt-2 border-l-2 border-red-300 pl-3">
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

      {done.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">完了</h2>
          <div className="rounded-lg border bg-white overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[360px]">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">タイトル</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">期限</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">状態</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {done.map((h) => (
                  <tr key={h.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium">{h.title}</p>
                      <SubjectTags ids={h.subjectIds} map={subjectMap} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {h.dueDate.toLocaleDateString("ja-JP")}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={h.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {homeworks.length === 0 && (
        <div className="rounded-lg border bg-white p-12 text-center">
          <p className="text-muted-foreground">宿題はまだありません</p>
        </div>
      )}
    </div>
  )
}
