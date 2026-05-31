function diffInDays(dueDate: Date): number {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const due = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function relativeDeadline(dueDate: Date): string {
  const diffDays = diffInDays(dueDate)

  if (diffDays < 0) return `${Math.abs(diffDays)}日超過`
  if (diffDays === 0) return "今日まで"
  if (diffDays === 1) return "明日まで"
  return `あと${diffDays}日`
}

export function deadlineColorClass(dueDate: Date): string {
  const diffDays = diffInDays(dueDate)

  if (diffDays < 0) return "text-red-600 font-semibold"
  if (diffDays <= 1) return "text-red-500 font-semibold"
  if (diffDays <= 3) return "text-amber-600"
  return "text-muted-foreground"
}