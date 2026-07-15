import { describe, expect, it } from "vitest"
import { hasValidBearerSecret } from "./request-auth"

function request(authorization?: string) {
  return new Request("https://example.test/api/cron", {
    headers: authorization ? { authorization } : undefined,
  })
}

describe("hasValidBearerSecret [NFR-SEC-02]", () => {
  it("秘密値が未設定なら Bearer undefined も拒否する", () => {
    expect(hasValidBearerSecret(request("Bearer undefined"), undefined)).toBe(false)
    expect(hasValidBearerSecret(request("Bearer "), "")).toBe(false)
  })

  it("ヘッダーなし・形式不正・値不一致を拒否する", () => {
    expect(hasValidBearerSecret(request(), "secret")).toBe(false)
    expect(hasValidBearerSecret(request("Basic secret"), "secret")).toBe(false)
    expect(hasValidBearerSecret(request("Bearer wrong"), "secret")).toBe(false)
  })

  it("完全に一致するBearer tokenだけを受理する", () => {
    expect(hasValidBearerSecret(request("Bearer secret"), "secret")).toBe(true)
    expect(hasValidBearerSecret(request("Bearer secrets"), "secret")).toBe(false)
  })
})
