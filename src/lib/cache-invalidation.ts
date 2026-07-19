import "server-only"

import { updateTag } from "next/cache"
import { cacheTags } from "./cache-tags"

function expire(...tags: string[]) {
  for (const tag of new Set(tags)) updateTag(tag)
}

export function invalidateHomework(input: {
  teacherId: string
  studentId: string
  homeworkId?: string
  studentUserId?: string
}) {
  expire(
    cacheTags.teacherHomework(input.teacherId),
    cacheTags.studentHomework(input.studentId),
    cacheTags.student(input.studentId),
    cacheTags.garden(input.studentId),
    cacheTags.notifications(input.teacherId),
    ...(input.homeworkId ? [cacheTags.homework(input.homeworkId)] : []),
    ...(input.studentUserId ? [cacheTags.notifications(input.studentUserId)] : [])
  )
}

export function invalidateCalendar(input: {
  teacherId: string
  studentId: string
  studentUserId?: string
  affectsBilling?: boolean
}) {
  expire(
    cacheTags.teacherCalendar(input.teacherId),
    cacheTags.studentCalendar(input.studentId),
    cacheTags.student(input.studentId),
    cacheTags.notifications(input.teacherId),
    ...(input.studentUserId ? [cacheTags.notifications(input.studentUserId)] : []),
    ...(input.affectsBilling
      ? [cacheTags.teacherBilling(input.teacherId), cacheTags.studentBilling(input.studentId)]
      : [])
  )
}

export function invalidateGrades(input: { teacherId: string; studentId: string }) {
  expire(
    cacheTags.teacherGrades(input.teacherId),
    cacheTags.studentGrades(input.studentId),
    cacheTags.student(input.studentId),
    cacheTags.garden(input.studentId)
  )
}

export function invalidateBilling(input: { teacherId: string; studentId: string }) {
  expire(
    cacheTags.teacherBilling(input.teacherId),
    cacheTags.studentBilling(input.studentId),
    cacheTags.student(input.studentId)
  )
}

export function invalidateStudent(input: { teacherId: string; studentId: string; userId?: string }) {
  expire(
    cacheTags.teacherStudents(input.teacherId),
    cacheTags.student(input.studentId),
    cacheTags.teacherHomework(input.teacherId),
    cacheTags.studentHomework(input.studentId),
    cacheTags.teacherCalendar(input.teacherId),
    cacheTags.studentCalendar(input.studentId),
    cacheTags.teacherGrades(input.teacherId),
    cacheTags.studentGrades(input.studentId),
    cacheTags.teacherBilling(input.teacherId),
    cacheTags.studentBilling(input.studentId),
    cacheTags.garden(input.studentId),
    ...(input.userId ? [cacheTags.user(input.userId), cacheTags.notifications(input.userId)] : [])
  )
}

export function invalidateSubjects(teacherId: string) {
  expire(
    cacheTags.subjects(teacherId),
    cacheTags.teacherStudents(teacherId),
    cacheTags.teacherHomework(teacherId),
    cacheTags.teacherCalendar(teacherId),
    cacheTags.teacherGrades(teacherId)
  )
}

export function invalidateMaterials(input: { teacherId: string; studentId: string }) {
  expire(cacheTags.materials(input.studentId), cacheTags.student(input.studentId), cacheTags.teacherHomework(input.teacherId))
}

export function invalidateParentStudents(parentId: string) {
  expire(cacheTags.parentStudents(parentId), cacheTags.notifications(parentId))
}

export function invalidateUser(userId: string) {
  expire(cacheTags.user(userId), cacheTags.notifications(userId))
}
