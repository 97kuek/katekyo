import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import CreateHomeworkForm from "./create-form"
import { PageHeader } from "@/components/ui/page-header"

export default async function NewHomeworkPage({ searchParams }: { searchParams: Promise<{ studentId?: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== "teacher") redirect("/dashboard")
  const { studentId } = await searchParams

  const [students, allMaterials, subjects] = await Promise.all([
    db.student.findMany({
      where: { teacherId: session.user.id },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.studentMaterial.findMany({
      where: { teacherId: session.user.id },
      select: { id: true, name: true, studentId: true },
      orderBy: { createdAt: "asc" },
    }),
    db.subject.findMany({
      where: { teacherId: session.user.id },
      select: { id: true, name: true },
    }),
  ])

  const materialsByStudent: Record<string, { id: string; name: string }[]> = {}
  for (const m of allMaterials) {
    if (!materialsByStudent[m.studentId]) materialsByStudent[m.studentId] = []
    materialsByStudent[m.studentId].push({ id: m.id, name: m.name })
  }

  if (students.length === 0) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <PageHeader backHref="/homework" backLabel="宿題一覧" title="宿題を作成" />
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
      <PageHeader backHref="/homework" backLabel="宿題一覧" title="宿題を作成" description="生徒に新しい宿題を割り当てます。" />
      <Card size="sm">
        <CardContent className="py-1">
          <CreateHomeworkForm students={students} materialsByStudent={materialsByStudent} subjects={subjects} defaultStudentId={studentId} />
        </CardContent>
      </Card>
    </div>
  )
}
