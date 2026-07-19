import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

describe("service worker authenticated-data boundary", () => {
  const source = readFileSync(resolve(process.cwd(), "src/sw.ts"), "utf8")

  it("keeps navigations, RSC requests and API responses out of Cache Storage", () => {
    expect(source).toContain('request.mode === "navigate"')
    expect(source).toContain('request.headers.get("RSC") === "1"')
    expect(source).toContain('url.pathname.startsWith("/api/")')
    expect(source).toContain("handler: new NetworkOnly()")
  })

  it("does not restore Serwist's broad default runtime cache", () => {
    expect(source).not.toContain("defaultCache")
  })
})
