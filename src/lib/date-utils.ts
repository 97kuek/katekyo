export function relativeDeadline(dueDate: Date): string {
  const now = new Date()
  const diffMs = dueDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return `${Math.abs(diffDays)}日超過`
  if (diffDays === 0) return "今日まで"
  if (diffDays === 1) return "明日まで"
  return `あと${diffDays}日`
}

export function deadlineColorClass(dueDate: Date): string {
  const now = new Date()
  const diffMs = dueDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return "text-red-600 font-semibold"
  if (diffDays <= 1) return "text-red-500 font-semibold"
  if (diffDays <= 3) return "text-amber-600"
  return "text-muted-foreground"
}
