"use server"

import { db } from "@/lib/db"
import { requireStudent } from "@/lib/action-guards"
import { invalidateCalendar } from "@/lib/cache-invalidation"

export async function markLessonLogSeen(lessonId: string) {
  const guard = await requireStudent()
  if (!guard) return

  await db.lesson.updateMany({
    where: { id: lessonId, studentId: guard.student.id, lessonLogSeenAt: null },
    data: { lessonLogSeenAt: new Date() },
  })
  invalidateCalendar({
    teacherId: guard.student.teacherId,
    studentId: guard.student.id,
    studentUserId: guard.session.user.id,
  })
}
