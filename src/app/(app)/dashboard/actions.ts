"use server"

import { db } from "@/lib/db"
import { requireStudent } from "@/lib/action-guards"

export async function markLessonLogSeen(lessonId: string) {
  const guard = await requireStudent()
  if (!guard) return

  await db.lesson.updateMany({
    where: { id: lessonId, studentId: guard.student.id, lessonLogSeenAt: null },
    data: { lessonLogSeenAt: new Date() },
  })
  // ダッシュボード上で閲覧するため revalidate しない（ローカル state で既読表示を即時反映）
}
