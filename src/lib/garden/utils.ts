export type GardenItemType = "tree" | "bush" | "flower" | "cherry" | "big_tree" | "bamboo" | "mushroom"

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
