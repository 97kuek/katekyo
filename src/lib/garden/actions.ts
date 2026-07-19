import { db } from "@/lib/db"
import { GARDEN_GRID_SIZE } from "./utils"
import type { GardenItemType } from "./utils"

export async function plantForHomeworkApproval(
  homework: { id: string; studentId: string; dueDate: Date; submittedAt: Date | null },
  wasRejected: boolean,
  approvedCountOverride?: number
): Promise<void> {
  const wasLate = homework.submittedAt != null && homework.submittedAt > homework.dueDate
  if (wasRejected || wasLate) return
  try {
    const approvedCount = approvedCountOverride ?? (await db.homework.count({
      where: { studentId: homework.studentId, status: "approved" },
    }))
    const forcedType: GardenItemType | undefined = approvedCount % 5 === 0 ? "big_tree" : undefined
    await plantGardenItem(homework.studentId, forcedType)
  } catch (err) {
    console.error("[garden] plantGardenItem failed:", err)
  }
}

const GRID_SIZE = GARDEN_GRID_SIZE
const ITEM_WEIGHTS: GardenItemType[] = [
  "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
  "bush", "bush", "bush", "bush", "bush", "bush",
  "flower", "flower", "flower", "flower", "flower", "flower",
  "mushroom",
]

// 同時承認（一括承認の並列実行）で同じ空きマスを選んだ場合の unique 制約違反
function isUniqueConstraintError(err: unknown): boolean {
  return (
    typeof err === "object" && err !== null && "code" in err &&
    (err as { code?: string }).code === "P2002"
  )
}

const PLANT_MAX_ATTEMPTS = 3

export async function plantGardenItem(studentId: string, forcedType?: GardenItemType, sourceGradeId?: string) {
  for (let attempt = 1; attempt <= PLANT_MAX_ATTEMPTS; attempt++) {
    const existing = await db.gardenItem.findMany({
      where: { studentId },
      select: { x: true, y: true, sourceGradeId: true },
    })

    let occupied = new Set(existing.map(({ x, y }) => `${x},${y}`))

    // 64個満杯 → 世代リセット
    if (occupied.size >= GRID_SIZE * GRID_SIZE) {
      const completedGradeIds = existing.flatMap((item) => item.sourceGradeId ? [item.sourceGradeId] : [])
      await db.$transaction([
        db.gradeRecord.updateMany({
          where: { id: { in: completedGradeIds } },
          data: { gardenEvaluationVersion: 2 },
        }),
        db.gardenItem.deleteMany({ where: { studentId } }),
        db.student.update({
          where: { id: studentId },
          data: { gardenGeneration: { increment: 1 } },
        }),
      ])
      occupied = new Set()
    }

    const empty: [number, number][] = []
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        if (!occupied.has(`${x},${y}`)) empty.push([x, y])
      }
    }
    if (empty.length === 0) return
    const [x, y] = empty[Math.floor(Math.random() * empty.length)]
    const itemType = forcedType ?? ITEM_WEIGHTS[Math.floor(Math.random() * ITEM_WEIGHTS.length)]
    try {
      await db.gardenItem.create({ data: { studentId, x, y, itemType, sourceGradeId } })
      return
    } catch (err) {
      if (!isUniqueConstraintError(err) || attempt === PLANT_MAX_ATTEMPTS) throw err
      // 別の並列承認が同じマスに植えた → 空きマスを取り直して再試行
    }
  }
}

export async function syncGradeGardenItem(
  gradeId: string,
  studentId: string,
  itemType: GardenItemType | null
) {
  const existing = await db.gardenItem.findUnique({
    where: { sourceGradeId: gradeId },
    select: { id: true },
  })

  if (!itemType) {
    if (existing) await db.gardenItem.delete({ where: { id: existing.id } })
    return
  }
  if (existing) {
    await db.gardenItem.update({ where: { id: existing.id }, data: { itemType } })
    return
  }
  await plantGardenItem(studentId, itemType, gradeId)
}
