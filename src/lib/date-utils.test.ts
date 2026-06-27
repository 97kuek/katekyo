import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { relativeDeadline, deadlineColorClass, formatDate, formatDateTime } from "./date-utils"

// 固定日時: 2024-01-15T00:00:00Z = JST 2024-01-15 09:00:00
// JST では 1月15日として扱われる
const FAKE_NOW = new Date("2024-01-15T00:00:00Z")

function jstDate(dateStr: string): Date {
  // "YYYY-MM-DD" を JST 0時として作成
  return new Date(`${dateStr}T00:00:00+09:00`)
}

describe("relativeDeadline", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(FAKE_NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("今日期限は「今日まで」を返す", () => {
    expect(relativeDeadline(jstDate("2024-01-15"))).toBe("今日まで")
  })

  it("明日期限は「明日まで」を返す", () => {
    expect(relativeDeadline(jstDate("2024-01-16"))).toBe("明日まで")
  })

  it("5日後期限は「あと5日」を返す", () => {
    expect(relativeDeadline(jstDate("2024-01-20"))).toBe("あと5日")
  })

  it("1日超過は「1日超過」を返す", () => {
    expect(relativeDeadline(jstDate("2024-01-14"))).toBe("1日超過")
  })

  it("3日超過は「3日超過」を返す", () => {
    expect(relativeDeadline(jstDate("2024-01-12"))).toBe("3日超過")
  })
})

describe("deadlineColorClass", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(FAKE_NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("超過（負の差分）は text-destructive を返す", () => {
    expect(deadlineColorClass(jstDate("2024-01-14"))).toBe("text-destructive font-semibold")
  })

  it("今日期限(diffDays=0)は text-destructive を返す", () => {
    expect(deadlineColorClass(jstDate("2024-01-15"))).toBe("text-destructive font-semibold")
  })

  it("明日期限(diffDays=1)は text-destructive を返す", () => {
    expect(deadlineColorClass(jstDate("2024-01-16"))).toBe("text-destructive font-semibold")
  })

  it("2日後(diffDays=2)は text-warning を返す", () => {
    expect(deadlineColorClass(jstDate("2024-01-17"))).toBe("text-warning")
  })

  it("3日後(diffDays=3)は text-warning を返す", () => {
    expect(deadlineColorClass(jstDate("2024-01-18"))).toBe("text-warning")
  })

  it("4日後(diffDays=4)は text-muted-foreground を返す", () => {
    expect(deadlineColorClass(jstDate("2024-01-19"))).toBe("text-muted-foreground")
  })

  it("余裕あり(diffDays=30)は text-muted-foreground を返す", () => {
    expect(deadlineColorClass(jstDate("2024-02-14"))).toBe("text-muted-foreground")
  })
})

describe("formatDate", () => {
  it("UTC深夜でも JST の日付(YYYY/M/D)を返す", () => {
    // 2024-01-15T00:00:00Z = JST 2024-01-15 09:00 → "2024/1/15"
    expect(formatDate(new Date("2024-01-15T00:00:00Z"))).toBe("2024/1/15")
  })

  it("JST 日付変更直前(UTC 14:59)は同日を返す", () => {
    // 2024-01-15T14:59:00Z = JST 2024-01-15 23:59 → まだ15日
    expect(formatDate(new Date("2024-01-15T14:59:00Z"))).toBe("2024/1/15")
  })

  it("JST 日付変更直後(UTC 15:00)は翌日を返す", () => {
    // 2024-01-15T15:00:00Z = JST 2024-01-16 00:00 → 16日
    expect(formatDate(new Date("2024-01-15T15:00:00Z"))).toBe("2024/1/16")
  })
})

describe("formatDateTime", () => {
  it("JST の日時文字列を返す", () => {
    // 2024-01-15T00:00:00Z = JST 9:00
    const result = formatDateTime(new Date("2024-01-15T00:00:00Z"))
    expect(result).toContain("2024")
    expect(result).toContain("1")
    expect(result).toContain("15")
  })

  it("オプションで時刻のみ返せる", () => {
    const result = formatDateTime(new Date("2024-01-15T00:00:00Z"), {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    expect(result).toBe("09:00")
  })
})
