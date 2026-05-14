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

  const [pendingCount, studentCount, gradeCount, pendingHomeworks] = await Promise.all([
    db.homework.count({ where: { teacherId, status: "submitted" } }),
    db.student.count({ where: { teacherId } }),
    db.gradeRecord.count({ where: { teacherId, createdAt: { gte: monthStart } } }),
    db.homework.findMany({
      where: { teacherId, status: "submitted" },
      include: { student: { include: { user: { select: { name: true } } } } },
      orderBy: { submittedAt: "desc" },
      take: 5,
    }),
  ])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard title="承認待ちの宿題" value={String(pendingCount)} accent={pendingCount > 0} />
        <SummaryCard title="登録生徒数" value={String(studentCount)} />
        <SummaryCard title="今月の成績記録" value={String(gradeCount)} />
      </div>

      {pendingHomeworks.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-yellow-800 bg-yellow-50 px-3 py-1.5 rounded-md inline-flex items-center gap-1.5">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-yellow-600 text-white text-xs">
              {pendingCount}
            </span>
            承認待ちの宿題
          </h2>
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
        </div>
      )}
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

  const [incompleteCount, latestGrade] = await Promise.all([
    db.homework.count({
      where: { studentId: student.id, status: { in: ["assigned", "rejected"] } },
    }),
    db.gradeRecord.findFirst({
      where: { studentId: student.id },
      orderBy: { date: "desc" },
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
    <div className="grid gap-4 md:grid-cols-2">
      <SummaryCard title="未完了の宿題" value={String(incompleteCount)} accent={incompleteCount > 0} />
      <SummaryCard title="直近の成績" value={latestScore} sub={latestGrade?.testName} />
    </div>
  )
}

function SummaryCard({
  title,
  value,
  accent,
  sub,
}: {
  title: string
  value: string
  accent?: boolean
  sub?: string
}) {
  return (
    <div className={`rounded-lg border bg-white p-5 shadow-sm ${accent ? "border-yellow-300" : ""}`}>
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className={`mt-2 text-3xl font-bold ${accent ? "text-yellow-700" : ""}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1 truncate">{sub}</p>}
    </div>
  )
}
