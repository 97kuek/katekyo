import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import ReviewForm from "./review-form"

export default async function ReviewHomeworkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session || session.user.role !== "teacher") redirect("/dashboard")

  const homework = await db.homework.findFirst({
    where: { id, teacherId: session.user.id },
    include: { student: { include: { user: { select: { name: true } } } } },
  })

  if (!homework) notFound()
  if (homework.status !== "submitted") redirect("/homework")

  return (
    <div className="max-w-lg space-y-6">
      <Link href="/homework" className="text-sm text-muted-foreground hover:underline">
        ← 宿題一覧に戻る
      </Link>

      <div className="rounded-lg border bg-white p-5 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground">{homework.student.user.name}</p>
            <h2 className="font-semibold text-lg mt-0.5">{homework.title}</h2>
          </div>
          <span className="text-xs text-muted-foreground shrink-0">
            期限: {homework.dueDate.toLocaleDateString("ja-JP")}
          </span>
        </div>

        {homework.description && (
          <p className="text-sm text-gray-600">{homework.description}</p>
        )}

        {homework.studentNote && (
          <div className="bg-gray-50 rounded-md p-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">生徒のコメント</p>
            <p className="text-sm">{homework.studentNote}</p>
          </div>
        )}
      </div>

      <ReviewForm id={id} />
    </div>
  )
}
