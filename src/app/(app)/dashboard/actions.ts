"use server"

import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function markLessonLogSeen(lessonId: string) {
  const session = await auth()
  if (!session || session.user.role !== "student") return

  const student = await db.student.findUnique({ where: { userId: session.user.id } })
  if (!student) return

  await db.lesson.updateMany({
    where: { id: lessonId, studentId: student.id, lessonLogSeenAt: null },
    data: { lessonLogSeenAt: new Date() },
  })
  // ダッシュボード上で閲覧するため revalidate しない（ローカル state で既読表示を即時反映）
}
