import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import CreateGradeForm from "./create-form"
import { PageHeader } from "@/components/ui/page-header"

export default async function NewGradePage({ searchParams }: { searchParams: Promise<{ studentId?: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== "teacher") redirect("/dashboard")
  const { studentId } = await searchParams

  const now = new Date()
  const pastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const [students, subjects, examEvents] = await Promise.all([
    db.student.findMany({
      where: { teacherId: session.user.id },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.subject.findMany({
      where: { teacherId: session.user.id },
      orderBy: { name: "asc" },
    }),
    db.examEvent.findMany({
      where: { teacherId: session.user.id, date: { gte: pastMonth } },
      include: { student: { include: { user: { select: { name: true } } } } },
      orderBy: { date: "desc" },
    }),
  ])

  if (students.length === 0) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <PageHeader backHref="/grades" backLabel="成績一覧" title="成績を記録" />
        <div className="apple-card-surface rounded-2xl p-12 text-center">
          <p className="text-muted-foreground">生徒が登録されていません</p>
          <p className="text-sm text-muted-foreground mt-1">
            まず
            <Link href="/students/invite" className="underline mx-1">生徒を招待</Link>
            してください
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader backHref="/grades" backLabel="成績一覧" title="成績を記録" description="テスト結果と生徒へのフィードバックを記録します。" />
      <Card>
        <CardHeader>
          <CardTitle>成績を記録する</CardTitle>
          <CardDescription>得点と満点、順位と受験者数はセットで入力します。数値結果がなくても記録できます。</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateGradeForm students={students} subjects={subjects} examEvents={examEvents.map((e) => ({
            id: e.id,
            name: e.name,
            testType: e.testType,
            date: e.date.toISOString().slice(0, 10),
            studentId: e.studentId,
            studentName: e.student.user.name ?? "",
          }))} defaultStudentId={studentId} />
        </CardContent>
      </Card>
    </div>
  )
}
