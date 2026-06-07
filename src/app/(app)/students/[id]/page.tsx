import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart2, BookOpen, TreePine, Users, ChevronRight } from "lucide-react"
import { UpdateGradeForm } from "../update-grade-form"
import { UpdateStudentRatesForm } from "../update-student-rates-form"
import { ViewAsButton } from "../view-as-button"
import { ResetPasswordButton } from "../reset-password-button"
import { DeleteStudentButton } from "../delete-student-button"

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== "teacher") redirect("/dashboard")

  const { id } = await params
  const now = new Date()

  const [student, subjects] = await Promise.all([
    db.student.findUnique({
      where: { id, teacherId: session.user.id },
      include: { user: { select: { name: true, email: true } } },
    }),
    db.subject.findMany({
      where: { teacherId: session.user.id },
      orderBy: { name: "asc" },
    }),
  ])

  if (!student) notFound()

  const [homeworkStats, gardenCount, problemCount] = await Promise.all([
    db.homework.groupBy({
      by: ["status"],
      where: { teacherId: session.user.id, studentId: student.id },
      _count: { status: true },
    }),
    db.gardenItem.count({ where: { studentId: student.id } }),
    db.homework.count({
      where: {
        teacherId: session.user.id,
        studentId: student.id,
        OR: [
          { status: "assigned", dueDate: { lt: now } },
          { status: "rejected" },
        ],
      },
    }),
  ])

  let total = 0
  let approved = 0
  for (const row of homeworkStats) {
    total += row._count.status
    if (row.status === "approved") approved += row._count.status
  }
  const pct = total > 0 ? Math.round((approved / total) * 100) : null

  const isFull = gardenCount >= 64
  const isWithered = problemCount > 0 && gardenCount > 0

  const navLinks = [
    { href: `/students/${student.id}/grades`, Icon: BarChart2, label: "成績" },
    { href: `/students/${student.id}/materials`, Icon: BookOpen, label: "教材" },
    { href: `/students/${student.id}/garden`, Icon: TreePine, label: "学習の森", garden: true },
    { href: `/students/${student.id}/parents`, Icon: Users, label: "保護者管理" },
  ]

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <Link href="/students" className="text-sm text-muted-foreground hover:underline">
          ← 生徒一覧に戻る
        </Link>
        <div className="mt-2 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-baseline gap-3">
            <h1 className="text-2xl font-bold">{student.user.name}</h1>
            <span className="text-sm text-muted-foreground">{student.grade}</span>
          </div>
          <ViewAsButton studentId={student.id} />
        </div>
      </div>

      {/* 基本情報 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">基本情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">メールアドレス</span>
            <span className="truncate">{student.user.email}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">登録日</span>
            <span>{student.createdAt.toLocaleDateString("ja-JP")}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">学年</span>
            <div className="flex items-center gap-2">
              <span>{student.grade}</span>
              <UpdateGradeForm studentId={student.id} currentGrade={student.grade} />
            </div>
          </div>
          <div className="space-y-1.5 border-t pt-4">
            <span className="text-muted-foreground">時給・交通費・授業時間・科目</span>
            <UpdateStudentRatesForm
              studentId={student.id}
              defaultHourlyRate={student.defaultHourlyRate}
              defaultTravelExpense={student.defaultTravelExpense}
              defaultDurationMin={student.defaultDurationMin}
              defaultSubjectIds={student.defaultSubjectIds}
              subjects={subjects.map((sub) => ({ id: sub.id, name: sub.name }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* 宿題進捗 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">宿題進捗</CardTitle>
        </CardHeader>
        <CardContent>
          {pct != null ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>承認済み {approved} / {total} 件</span>
                <span className="font-medium text-foreground">{pct}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">まだ宿題がありません</p>
          )}
        </CardContent>
      </Card>

      {/* 各種ページへのナビ */}
      <div className="grid grid-cols-2 gap-3">
        {navLinks.map(({ href, Icon, label, garden }) => (
          <Link
            key={href}
            href={href}
            className="rounded-lg border bg-card p-4 flex items-center gap-3 hover:bg-muted transition-colors"
          >
            <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
            <span className="font-medium text-sm">{label}</span>
            {garden && isFull && (
              <span className="text-[10px] font-bold text-warning-foreground bg-warning/20 px-1.5 py-0.5 rounded">満開</span>
            )}
            {garden && isWithered && !isFull && (
              <span className="inline-block h-2 w-2 rounded-full bg-warning shrink-0" />
            )}
            <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
          </Link>
        ))}
      </div>

      {/* アカウント操作 */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base">アカウント操作</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <ResetPasswordButton studentId={student.id} />
          <DeleteStudentButton studentId={student.id} studentName={student.user.name ?? ""} />
        </CardContent>
      </Card>
    </div>
  )
}
