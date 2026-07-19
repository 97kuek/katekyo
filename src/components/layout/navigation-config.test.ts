import { describe, expect, it } from "vitest"
import { getMoreNavigation, getPageTitle, mobileNavigation } from "./navigation-config"

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

  it("groups the teacher's secondary destinations by task before account and support", () => {
    const groups = getMoreNavigation("teacher")

    expect(groups.map((group) => group.label)).toEqual(["学習管理", "アカウント", "サポート"])
    expect(groups.flatMap((group) => group.items.map((item) => item.href))).toEqual([
      "/grades",
      "/billing",
      "/profile",
      "/settings",
      "/help",
    ])
  })

  it("keeps profile before settings and help for every role", () => {
    for (const role of ["teacher", "student", "parent"] as const) {
      const paths = getMoreNavigation(role).flatMap((group) => group.items.map((item) => item.href))
      expect(paths.indexOf("/profile")).toBeLessThan(paths.indexOf("/settings"))
      expect(paths.indexOf("/settings")).toBeLessThan(paths.indexOf("/help"))
      expect(new Set(paths).size).toBe(paths.length)
    }
  })
})
