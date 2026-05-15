export type TestType = "mock" | "exam" | "quiz" | "other"

export const TEST_TYPE_LABELS: Record<TestType, string> = {
  mock: "模試",
  exam: "定期テスト",
  quiz: "小テスト",
  other: "その他",
}

export const TEST_TYPE_OPTIONS = Object.entries(TEST_TYPE_LABELS) as [TestType, string][]
