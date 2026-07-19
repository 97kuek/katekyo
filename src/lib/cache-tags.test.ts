import { describe, expect, it } from "vitest"
import { cacheTags } from "./cache-tags"

describe("cacheTags tenant isolation", () => {
  it("creates distinct tags for different tenant and student identifiers", () => {
    expect(cacheTags.teacherHomework("teacher-a")).not.toBe(cacheTags.teacherHomework("teacher-b"))
    expect(cacheTags.studentHomework("student-a")).not.toBe(cacheTags.studentHomework("student-b"))
    expect(cacheTags.parentStudents("parent-a")).not.toBe(cacheTags.parentStudents("parent-b"))
  })

  it("keeps resource namespaces distinct when identifiers happen to match", () => {
    const id = "same-id"
    const tags = [
      cacheTags.user(id),
      cacheTags.student(id),
      cacheTags.teacherHomework(id),
      cacheTags.studentHomework(id),
      cacheTags.teacherCalendar(id),
      cacheTags.studentCalendar(id),
      cacheTags.teacherBilling(id),
      cacheTags.studentBilling(id),
    ]

    expect(new Set(tags).size).toBe(tags.length)
  })
})
