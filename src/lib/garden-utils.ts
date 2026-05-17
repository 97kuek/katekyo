type GardenItemType = "tree" | "bush" | "flower"

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
