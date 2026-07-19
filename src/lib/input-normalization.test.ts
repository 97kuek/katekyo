import { describe, expect, it } from "vitest"
import { normalizeEmailInput } from "./input-normalization"

describe("normalizeEmailInput", () => {
  it("全角英数字を半角へ変換し、小文字化する", () => {
    expect(normalizeEmailInput(" Ｔｅｓｔ＠ＥＸＡＭＰＬＥ．ＣＯＭ ")).toBe("test@example.com")
  })

  it("文字列以外はそのまま返す", () => {
    expect(normalizeEmailInput(null)).toBeNull()
  })
})
