import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import ReviewForm from "./review-form"
import { DifficultyBars } from "@/components/homework/difficulty-bars"
import { formatDate } from "@/lib/date-utils"
import { createHomeworkPhotoSignedUrl } from "@/lib/supabase-storage"

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
  const photoUrl = homework.photoUrl
    ? await createHomeworkPhotoSignedUrl(homework.photoUrl)
    : null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/homework" className="text-sm text-muted-foreground hover:underline">
        ← 宿題一覧に戻る
      </Link>

      <div className="rounded-lg border bg-card p-5 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground">{homework.student.user.name}</p>
            <h2 className="font-semibold text-lg mt-0.5">{homework.title}</h2>
          </div>
          <span className="text-xs text-muted-foreground shrink-0">
            期限: {formatDate(homework.dueDate)}
          </span>
        </div>

        {homework.description && (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{homework.description}</p>
        )}

        {photoUrl && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">提出写真</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoUrl}
              alt="提出写真"
              className="w-full max-h-60 sm:max-h-80 object-contain rounded-md border bg-muted"
            />
          </div>
        )}
        {homework.difficultyRating && (
          <p className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-1 ${
            homework.difficultyRating === 1 ? "text-primary bg-primary/10" :
            homework.difficultyRating === 2 ? "text-warning bg-warning/10" :
            "text-destructive bg-destructive/10"
          }`}>
            <DifficultyBars level={homework.difficultyRating} className="w-4 h-2.5" />
            {homework.difficultyRating === 1 ? "かんたん" : homework.difficultyRating === 2 ? "ふつう" : "むずかしい"}
          </p>
        )}
        {homework.studentNote && (
          <div className="bg-muted rounded-md p-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">生徒のコメント</p>
            <p className="text-sm">{homework.studentNote}</p>
          </div>
        )}
      </div>

      <ReviewForm id={id} />
    </div>
  )
}
