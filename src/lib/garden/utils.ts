export type GardenItemType = "tree" | "bush" | "flower" | "cherry" | "big_tree" | "bamboo" | "mushroom"

/** 学習の森のグリッドは 8×8 = 64 マス */
export const GARDEN_GRID_SIZE = 8
export const GARDEN_CAPACITY = GARDEN_GRID_SIZE * GARDEN_GRID_SIZE
/** お祝い演出を出す植物数 */
export const GARDEN_MILESTONES = [10, 25, 50] as const

export function scoreToGardenItemType(
  score: number | null,
  maxScore: number | null,
  deviation: number | null
): GardenItemType | null {
  if (score !== null && maxScore !== null && maxScore > 0) {
    const pct = score / maxScore
    if (pct >= 1.0) return "bamboo"
    if (pct >= 0.9) return "cherry"
    if (pct >= 0.8) return "tree"
    if (pct >= 0.6) return "bush"
    return "flower"
  }
  if (deviation !== null) {
    if (deviation >= 70) return "bamboo"
    if (deviation >= 65) return "cherry"
    if (deviation >= 60) return "tree"
    if (deviation >= 50) return "bush"
    return "flower"
  }
  return null
}
