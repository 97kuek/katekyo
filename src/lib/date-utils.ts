const JST = "Asia/Tokyo"

/** Date を JST の年月日に分解する（サーバーが UTC でも日本時間で判定するため） */
function jstYmd(d: Date): [number, number, number] {
  const [y, m, day] = d
    .toLocaleDateString("en-CA", { timeZone: JST }) // "YYYY-MM-DD"
    .split("-")
    .map(Number)
  return [y, m, day]
}

function diffInDays(dueDate: Date): number {
  const [ny, nm, nd] = jstYmd(new Date())
  const [dy, dm, dd] = jstYmd(dueDate)
  const today = Date.UTC(ny, nm - 1, nd)
  const due = Date.UTC(dy, dm - 1, dd)
  return Math.round((due - today) / (1000 * 60 * 60 * 24))
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

  if (diffDays <= 1) return "text-destructive font-semibold"
  if (diffDays <= 3) return "text-warning"
  return "text-muted-foreground"
}

/** 日付を JST で "YYYY/M/D" 表示（実時刻でも日本時間の日付を返す） */
export function formatDate(d: Date): string {
  return d.toLocaleDateString("ja-JP", { timeZone: JST })
}

/** 日付を JST で "M/D" 表示 */
export function formatShortDate(d: Date): string {
  return d.toLocaleDateString("ja-JP", { timeZone: JST, month: "numeric", day: "numeric" })
}

/** 日付を JST で "M月D日（曜）" 表示 */
export function formatDateWithWeekday(d: Date): string {
  return d.toLocaleDateString("ja-JP", {
    timeZone: JST,
    month: "long",
    day: "numeric",
    weekday: "short",
  })
}

/** 時刻を JST で "HH:MM" 表示 */
export function formatTime(d: Date): string {
  return d.toLocaleTimeString("ja-JP", { timeZone: JST, hour: "2-digit", minute: "2-digit" })
}

/** 日時を JST で表示 */
export function formatDateTime(
  d: Date,
  opts: Intl.DateTimeFormatOptions = {}
): string {
  return d.toLocaleString("ja-JP", { timeZone: JST, ...opts })
}
