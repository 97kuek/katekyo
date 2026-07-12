import { cache } from "react"
import { db } from "./db"
import { GARDEN_CAPACITY, GARDEN_MILESTONES } from "./garden/utils"
import type { GardenItemType } from "./garden/utils"

// Per-request deduplication via React cache().
// The student dashboard renders StudentSummaryCards / StudentUpcomingSection /
// StudentRecentGrades in separate Suspense boundaries; each used to fire its own
// db.student.findUnique round-trip. With cache() only the first call hits the DB.
export const getStudentByUserId = cache(async (userId: string) => {
  return db.student.findUnique({ where: { userId } })
})

/** テナントの科目一覧（リクエスト内で重複呼び出ししても DB は1回） */
export const getSubjectsByTeacherId = cache(async (teacherId: string) => {
  return db.subject.findMany({
    where: { teacherId },
    orderBy: { createdAt: "asc" },
  })
})

/** 科目ID → 科目名 の Map を作る（subjectIds の名前解決用） */
export function buildSubjectMap(subjects: { id: string; name: string }[]): Map<string, string> {
  return new Map(subjects.map((s) => [s.id, s.name]))
}

/**
 * 学習の森の表示状態を取得する。
 * 期限切れ・差し戻しの宿題数ぶんだけ古い植物から「枯れた」状態にする。
 */
export async function getGardenState(studentId: string) {
  const now = new Date()
  const [rawItems, overdueCount] = await Promise.all([
    db.gardenItem.findMany({
      where: { studentId },
      select: { x: true, y: true, itemType: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    db.homework.count({
      where: {
        studentId,
        OR: [
          { status: "assigned", dueDate: { lt: now } },
          { status: "rejected" },
        ],
      },
    }),
  ])

  const witheredCount = Math.min(overdueCount, rawItems.length)
  const items = rawItems.map((item, i) => ({
    x: item.x,
    y: item.y,
    itemType: item.itemType as GardenItemType,
    withered: i < witheredCount,
  }))

  const total = items.length
  return {
    items,
    total,
    witheredCount,
    overdueCount,
    isFull: total >= GARDEN_CAPACITY,
    milestone: (GARDEN_MILESTONES as readonly number[]).includes(total) ? total : undefined,
  }
}

/**
 * 保護者がアクセス可能な生徒一覧と、表示対象の生徒を解決する。
 * studentIdParam が指定されていれば紐づく生徒の中から選び、無効なら先頭の生徒を返す。
 */
export async function getParentStudents(parentId: string, studentIdParam?: string) {
  const links = await db.parentStudent.findMany({
    where: { parentId },
    include: { student: { include: { user: { select: { name: true } } } } },
    orderBy: { createdAt: "asc" },
  })
  const students = links.map((l) => l.student)
  const selected =
    students.find((s) => s.id === studentIdParam) ?? students[0] ?? null
  return { students, selected }
}
