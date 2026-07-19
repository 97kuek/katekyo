import { describe, expect, it } from "vitest"
import { evaluateGrade, gradeDateFromInput, gradeRecordInputSchema, scorePercentage } from "./grade-record"

const base = { testName: "第1回", date: "2026-07-15", testType: "exam" as const, comment: null }

describe("grade record validation", () => {
  it("requires score and maximum score as a pair", () => {
    const result = gradeRecordInputSchema.safeParse({ ...base, score: "80", maxScore: "", avgScore: "", rank: "", totalStudents: "", deviation: "" })
    expect(result.success).toBe(false)
  })

  it("rejects impossible score and rank combinations", () => {
    const result = gradeRecordInputSchema.safeParse({ ...base, score: "110", maxScore: "100", avgScore: "101", rank: "20", totalStudents: "10", deviation: "" })
    expect(result.success).toBe(false)
  })

  it("rejects a calendar date that does not exist", () => {
    const result = gradeRecordInputSchema.safeParse({ ...base, date: "2026-02-30", score: "", maxScore: "", avgScore: "", rank: "", totalStudents: "", deviation: "" })
    expect(result.success).toBe(false)
  })

  it("round-trips a date-only value without timezone drift", () => {
    expect(gradeDateFromInput("2026-07-15").toISOString().slice(0, 10)).toBe("2026-07-15")
  })
})

describe("grade evaluation", () => {
  it("prefers deviation for mock exams", () => {
    expect(evaluateGrade({ testType: "mock", score: 70, maxScore: 100, deviation: 70 })).toEqual({ source: "deviation", value: 70, itemType: "bamboo" })
  })

  it("prefers score percentage for school and quiz tests", () => {
    expect(evaluateGrade({ testType: "exam", score: 70, maxScore: 100, deviation: 70 })?.itemType).toBe("bush")
    expect(evaluateGrade({ testType: "quiz", score: 90, maxScore: 100, deviation: 40 })?.itemType).toBe("cherry")
  })

  it("falls back to the available metric", () => {
    expect(evaluateGrade({ testType: "mock", score: 90, maxScore: 100, deviation: null })?.source).toBe("score")
    expect(evaluateGrade({ testType: "exam", score: null, maxScore: null, deviation: 65 })?.itemType).toBe("cherry")
  })

  it("does not treat a raw score without its maximum as a percentage", () => {
    expect(scorePercentage(80, null)).toBeNull()
  })
})
