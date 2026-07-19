import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { isPendingStatus } from "@/lib/homework-status"
import EditHomeworkForm from "./edit-form"
import { PageHeader } from "@/components/ui/page-header"

export default async function EditHomeworkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session || session.user.role !== "teacher") redirect("/dashboard")

  const [homework, subjects] = await Promise.all([
    db.homework.findFirst({
      where: { id, teacherId: session.user.id },
      include: { student: { include: { user: { select: { name: true } } } } },
    }),
    db.subject.findMany({ where: { teacherId: session.user.id }, orderBy: { name: "asc" } }),
  ])

  if (!homework) notFound()
  if (!isPendingStatus(homework.status)) redirect(`/homework/${id}`)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader backHref={`/homework/${id}`} backLabel="宿題詳細" title="宿題を編集" description={`${homework.student.user.name}・${homework.title}`} />
      <Card>
        <CardHeader>
          <CardTitle>宿題を編集</CardTitle>
        </CardHeader>
        <CardContent>
          <EditHomeworkForm homework={homework} subjects={subjects} />
        </CardContent>
      </Card>
    </div>
  )
}
