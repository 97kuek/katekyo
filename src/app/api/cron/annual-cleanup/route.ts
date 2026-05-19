import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// Vercel Cron calls this on April 1st at 00:00 UTC (09:00 JST).
// Deletes data from before April 1st of the previous school year.
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization")
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  // Cutoff = April 1st of the previous year (one full school year of retention)
  const cutoff = new Date(now.getFullYear() - 1, 3, 1) // month 3 = April (0-indexed)

  const [lessons, grades, homework, examEvents] = await Promise.all([
    db.lesson.deleteMany({ where: { date: { lt: cutoff } } }),
    db.gradeRecord.deleteMany({ where: { date: { lt: cutoff } } }),
    db.homework.deleteMany({ where: { dueDate: { lt: cutoff } } }),
    db.examEvent.deleteMany({ where: { date: { lt: cutoff } } }),
  ])

  return NextResponse.json({
    cutoff: cutoff.toISOString(),
    deletedLessons: lessons.count,
    deletedGrades: grades.count,
    deletedHomework: homework.count,
    deletedExamEvents: examEvents.count,
  })
}
