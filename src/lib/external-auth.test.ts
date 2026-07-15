import { describe, expect, it } from "vitest"
import { hashIdentityLinkToken, isLinkIntentValid } from "./external-auth"

describe("external auth linking", () => {
  it("stores a deterministic hash rather than the raw link token", () => {
    const raw = "sensitive-one-time-token"
    const hash = hashIdentityLinkToken(raw)

    expect(hash).toHaveLength(64)
    expect(hash).not.toContain(raw)
    expect(hashIdentityLinkToken(raw)).toBe(hash)
  })

  it("rejects an intent at and after its expiry", () => {
    const now = new Date("2026-07-15T00:00:00.000Z")

    expect(isLinkIntentValid(new Date("2026-07-15T00:00:00.001Z"), now)).toBe(true)
    expect(isLinkIntentValid(new Date("2026-07-15T00:00:00.000Z"), now)).toBe(false)
    expect(isLinkIntentValid(new Date("2026-07-14T23:59:59.999Z"), now)).toBe(false)
  })
})
