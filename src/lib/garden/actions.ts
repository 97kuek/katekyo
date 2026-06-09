"use server"

import { db } from "@/lib/db"
import type { GardenItemType } from "./utils"

export async function plantForHomeworkApproval(
  homework: { id: string; studentId: string; dueDate: Date; submittedAt: Date | null },
  wasRejected: boolean
): Promise<void> {
  const wasLate = homework.submittedAt != null && homework.submittedAt > homework.dueDate
  if (wasRejected || wasLate) return
  try {
    const approvedCount = await db.homework.count({
      where: { studentId: homework.studentId, status: "approved" },
    })
    const forcedType: GardenItemType | undefined = approvedCount % 5 === 0 ? "big_tree" : undefined
    await plantGardenItem(homework.studentId, forcedType)
  } catch (err) {
    console.error("[garden] plantGardenItem failed:", err)
  }
}

const GRID_SIZE = 8
const ITEM_WEIGHTS: GardenItemType[] = [
  "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
  "bush", "bush", "bush", "bush", "bush", "bush",
  "flower", "flower", "flower", "flower", "flower", "flower",
  "mushroom",
]

export async function plantGardenItem(studentId: string, forcedType?: GardenItemType) {
  const existing = await db.gardenItem.findMany({
    where: { studentId },
    select: { x: true, y: true },
  })

  let occupied = new Set(existing.map(({ x, y }) => `${x},${y}`))

  // 64個満杯 → 世代リセット
  if (occupied.size >= GRID_SIZE * GRID_SIZE) {
    await db.$transaction([
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
  await db.gardenItem.create({ data: { studentId, x, y, itemType } })
}
