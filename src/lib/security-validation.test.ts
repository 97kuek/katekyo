import { describe, expect, it } from "vitest"
import { isAllowedMeetUrl, matchesPathSegment } from "./security-validation"

describe("isAllowedMeetUrl [NFR-SEC-02]", () => {
  it("HTTPSのGoogle Meetホストだけを許可する", () => {
    expect(isAllowedMeetUrl("https://meet.google.com/abc-defg-hij")).toBe(true)
    expect(isAllowedMeetUrl("http://meet.google.com/abc")).toBe(false)
    expect(isAllowedMeetUrl("https://meet.google.com.evil.example/abc")).toBe(false)
    expect(isAllowedMeetUrl("https://evil.example/?next=meet.google.com")).toBe(false)
  })
})

describe("matchesPathSegment [NFR-SEC-02]", () => {
  it("完全一致またはslash境界だけをprefixとして扱う", () => {
    expect(matchesPathSegment("/invite", "/invite")).toBe(true)
    expect(matchesPathSegment("/invite/token", "/invite")).toBe(true)
    expect(matchesPathSegment("/invite-evil", "/invite")).toBe(false)
  })
})

