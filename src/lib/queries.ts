import { cache } from "react"
import { db } from "./db"

// Per-request deduplication via React cache().
// The student dashboard renders StudentSummaryCards / StudentUpcomingSection /
// StudentRecentGrades in separate Suspense boundaries; each used to fire its own
// db.student.findUnique round-trip. With cache() only the first call hits the DB.
export const getStudentByUserId = cache(async (userId: string) => {
  return db.student.findUnique({ where: { userId } })
})
