import { describe, expect, it } from "vitest"
import { escapeCsvCell } from "./csv"

describe("escapeCsvCell [NFR-SEC-02]", () => {
  it.each(["=1+1", "+cmd", "-2+3", "@SUM(A1)", "\tformula", "\rformula"])(
    "数式として解釈され得る値を無害化する: %s",
    (value) => expect(escapeCsvCell(value)).toBe(`"'${value}"`),
  )

  it("引用符を二重化する", () => {
    expect(escapeCsvCell('a"b')).toBe('"a""b"')
  })

  it("通常値と数値はそのまま引用する", () => {
    expect(escapeCsvCell("生徒A")).toBe('"生徒A"')
    expect(escapeCsvCell(1200)).toBe('"1200"')
  })
})

