import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import EditGradeForm from "./edit-form"

export default async function EditGradePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session || session.user.role !== "teacher") redirect("/dashboard")

  const [grade, subjects] = await Promise.all([
    db.gradeRecord.findFirst({
      where: { id, teacherId: session.user.id },
      include: { student: { include: { user: { select: { name: true } } } } },
    }),
    db.subject.findMany({ where: { teacherId: session.user.id }, orderBy: { name: "asc" } }),
  ])

  if (!grade) notFound()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/grades" className="text-sm text-muted-foreground hover:underline">
        ← 成績一覧に戻る
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>成績を編集</CardTitle>
        </CardHeader>
        <CardContent>
          <EditGradeForm grade={grade} subjects={subjects} />
        </CardContent>
      </Card>
    </div>
  )
}
