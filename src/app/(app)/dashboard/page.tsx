import { auth } from "@/lib/auth"

export default async function DashboardPage() {
  const session = await auth()
  const isTeacher = session?.user.role === "teacher"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {isTeacher ? "生徒の進捗を確認しましょう" : "今日の宿題を確認しましょう"}
        </p>
      </div>

      {isTeacher ? <TeacherDashboard /> : <StudentDashboard />}
    </div>
  )
}

function TeacherDashboard() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <SummaryCard title="承認待ちの宿題" value="0" />
      <SummaryCard title="登録生徒数" value="0" />
      <SummaryCard title="今月の成績記録" value="0" />
    </div>
  )
}

function StudentDashboard() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <SummaryCard title="未完了の宿題" value="0" />
      <SummaryCard title="直近の成績" value="-" />
    </div>
  )
}

function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border bg-white p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  )
}
