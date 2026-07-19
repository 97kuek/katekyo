import { describe, expect, it } from "vitest"
import { getPageTitle, mobileNavigation } from "./navigation-config"

describe("NFR-UI navigation", () => {
  it("keeps every mobile role at five primary destinations", () => {
    expect(mobileNavigation.teacher).toHaveLength(5)
    expect(mobileNavigation.student).toHaveLength(5)
    expect(mobileNavigation.parent).toHaveLength(5)
  })

  it("uses task-oriented schedule terminology", () => {
    for (const items of Object.values(mobileNavigation)) {
      const labels: string[] = items.map((item) => item.label)
      expect(labels).toContain("予定")
      expect(labels).not.toContain("カレンダー")
    }
  })

  it("resolves titles for dynamic and secondary routes", () => {
    expect(getPageTitle("/homework/example/review")).toBe("宿題を確認")
    expect(getPageTitle("/students/example/parents")).toBe("保護者管理")
    expect(getPageTitle("/garden")).toBe("学習の森")
    expect(getPageTitle("/more")).toBe("その他")
  })
})
