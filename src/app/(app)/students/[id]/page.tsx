import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { BarChart2, BookOpen, CalendarDays, CheckCircle2, ClipboardList, TreePine, Users, ChevronRight } from "lucide-react"
import { UpdateGradeForm } from "../update-grade-form"
import { UpdateStudentRatesForm } from "../update-student-rates-form"
import { ViewAsButton } from "../view-as-button"
import { ResetPasswordButton } from "../reset-password-button"
import { DeleteStudentButton } from "../delete-student-button"
import { formatDate } from "@/lib/date-utils"
import { GARDEN_CAPACITY } from "@/lib/garden/utils"
import { PageHeader } from "@/components/ui/page-header"
import { Disclosure } from "@/components/ui/disclosure"
import { buttonVariants } from "@/components/ui/button"

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

  const [gardenCount, problemCount, reviewCount, nextLesson, latestGrade] = await Promise.all([
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
    db.homework.count({ where: { teacherId: session.user.id, studentId: student.id, status: "submitted" } }),
    db.lesson.findFirst({
      where: { teacherId: session.user.id, studentId: student.id, date: { gte: now } },
      orderBy: { date: "asc" },
    }),
    db.gradeRecord.findFirst({
      where: { teacherId: session.user.id, studentId: student.id },
      orderBy: { date: "desc" },
    }),
  ])

  const isFull = gardenCount >= GARDEN_CAPACITY
  const isWithered = problemCount > 0 && gardenCount > 0

  const navLinks = [
    { href: `/homework?studentId=${student.id}`, Icon: ClipboardList, label: "宿題" },
    { href: `/calendar?studentId=${student.id}`, Icon: CalendarDays, label: "予定" },
    { href: `/grades?studentId=${student.id}`, Icon: BarChart2, label: "成績" },
    { href: `/students/${student.id}/materials`, Icon: BookOpen, label: "教材" },
    { href: `/students/${student.id}/garden`, Icon: TreePine, label: "学習の森", garden: true },
    { href: `/students/${student.id}/parents`, Icon: Users, label: "保護者管理" },
  ]

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <PageHeader
        backHref="/students"
        backLabel="生徒一覧"
        title={student.user.name}
        description={student.grade}
        action={
          <Link href={`/homework/new?studentId=${student.id}`} className={buttonVariants({ size: "sm" })}>
            宿題を出す
          </Link>
        }
      />

      <section aria-labelledby="student-overview" className="space-y-3">
        <h2 id="student-overview" className="text-sm font-semibold">現在の状況</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Link href={`/homework?studentId=${student.id}&view=review`} className="rounded-lg border bg-card p-4 transition-colors hover:bg-muted">
            <p className="text-xs text-muted-foreground">確認待ち</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{reviewCount}<span className="ml-1 text-sm font-normal text-muted-foreground">件</span></p>
            <p className="mt-1 text-xs text-muted-foreground">期限超過・差し戻し {problemCount}件</p>
          </Link>
          <Link href={`/calendar?studentId=${student.id}`} className="rounded-lg border bg-card p-4 transition-colors hover:bg-muted">
            <p className="text-xs text-muted-foreground">次回授業</p>
            {nextLesson ? (
              <p className="mt-1 font-semibold">{nextLesson.date.toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo", month: "numeric", day: "numeric", weekday: "short" })}<span className="ml-2 text-sm font-normal text-muted-foreground">{nextLesson.date.toLocaleTimeString("ja-JP", { timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit" })}</span></p>
            ) : <p className="mt-1 text-sm text-muted-foreground">予定はありません</p>}
          </Link>
          <Link href={`/grades?studentId=${student.id}`} className="rounded-lg border bg-card p-4 transition-colors hover:bg-muted">
            <p className="text-xs text-muted-foreground">直近の成績</p>
            {latestGrade ? (
              <><p className="mt-1 truncate font-semibold">{latestGrade.testName}</p><p className="mt-1 text-sm text-muted-foreground">{latestGrade.score != null ? `${latestGrade.score}${latestGrade.maxScore != null ? `/${latestGrade.maxScore}` : ""}` : latestGrade.deviation != null ? `偏差値 ${latestGrade.deviation}` : "記録あり"}</p></>
            ) : <p className="mt-1 text-sm text-muted-foreground">まだ記録がありません</p>}
          </Link>
        </div>
      </section>

      <section aria-labelledby="student-sections" className="space-y-3">
        <h2 id="student-sections" className="text-sm font-semibold">学習情報</h2>
        <div className="overflow-hidden rounded-lg border bg-card sm:grid sm:grid-cols-2">
          {navLinks.map(({ href, Icon, label, garden }, index) => (
            <Link
              key={href}
              href={href}
              className={`flex min-h-14 items-center gap-3 px-4 py-3 transition-colors hover:bg-muted ${index > 0 ? "border-t sm:border-t-0" : ""} ${index >= 2 ? "sm:border-t" : ""} ${index % 2 === 1 ? "sm:border-l" : ""}`}
            >
              <Icon className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
              <span className="font-medium text-sm">{label}</span>
              {garden && isFull && <span className="text-[10px] font-bold text-warning-foreground">満開</span>}
              {garden && isWithered && !isFull && <span className="inline-block h-2 w-2 rounded-full bg-warning shrink-0" />}
              <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto shrink-0" aria-hidden />
            </Link>
          ))}
        </div>
      </section>

      <Disclosure title="生徒設定" description="基本情報・料金・標準授業設定">
        <div className="space-y-4 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">メールアドレス</span>
            <span className="truncate">{student.user.email}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">登録日</span>
            <span>{formatDate(student.createdAt)}</span>
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
        </div>
      </Disclosure>

      <Disclosure title="その他の操作" description="生徒としての表示・アカウント管理">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-muted-foreground" aria-hidden /><ViewAsButton studentId={student.id} /></div>
          <Card className="border-destructive/30 py-3">
            <CardContent className="space-y-3">
              <p className="text-sm font-medium">アカウント管理</p>
              <div className="flex flex-wrap items-center gap-3">
                <ResetPasswordButton studentId={student.id} />
                <DeleteStudentButton studentId={student.id} studentName={student.user.name ?? ""} />
              </div>
            </CardContent>
          </Card>
        </div>
      </Disclosure>
    </div>
  )
}
