"use server"

import { db } from "./db"

type GardenItemType = "tree" | "bush" | "flower"

const GRID_SIZE = 8
const ITEM_WEIGHTS: GardenItemType[] = [
  "tree", "tree", "tree", "tree",
  "bush", "bush", "bush",
  "flower", "flower", "flower",
]

export async function plantGardenItem(studentId: string, forcedType?: GardenItemType) {
  const existing = await db.gardenItem.findMany({
    where: { studentId },
    select: { x: true, y: true },
  })
  const occupied = new Set(existing.map(({ x, y }) => `${x},${y}`))
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

// Returns the item type to plant based on grade score, or null if no numeric data
export function scoreToGardenItemType(
  score: number | null,
  maxScore: number | null,
  deviation: number | null
): GardenItemType | null {
  if (score !== null && maxScore !== null && maxScore > 0) {
    const pct = score / maxScore
    return pct >= 0.8 ? "tree" : pct >= 0.6 ? "bush" : "flower"
  }
  if (deviation !== null) {
    return deviation >= 60 ? "tree" : deviation >= 50 ? "bush" : "flower"
  }
  return null
}
