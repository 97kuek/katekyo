import { cookies } from "next/headers"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import type { Session } from "next-auth"
import { cache } from "react"

const COOKIE_NAME = "katekyo_view_as"

export type ViewingAs = {
  studentId: string
  studentName: string
  studentUserId: string
}

export type ViewingContext = {
  session: Session
  viewingAs: ViewingAs | null
  effectiveUserId: string
  effectiveRole: string
}

export const getViewingContext = cache(async (): Promise<ViewingContext | null> => {
  const session = await auth()
  if (!session) return null

  if (session.user.role !== "teacher") {
    return {
      session,
      viewingAs: null,
      effectiveUserId: session.user.id,
      effectiveRole: session.user.role,
    }
  }

  const cookieStore = await cookies()
  const studentId = cookieStore.get(COOKIE_NAME)?.value
  if (!studentId) {
    return {
      session,
      viewingAs: null,
      effectiveUserId: session.user.id,
      effectiveRole: session.user.role,
    }
  }

  const student = await db.student.findFirst({
    where: { id: studentId, teacherId: session.user.id },
    select: { userId: true, user: { select: { name: true } } },
  })
  if (!student) {
    return {
      session,
      viewingAs: null,
      effectiveUserId: session.user.id,
      effectiveRole: session.user.role,
    }
  }

  return {
    session,
    viewingAs: {
      studentId,
      studentName: student.user.name ?? "",
      studentUserId: student.userId,
    },
    effectiveUserId: student.userId,
    effectiveRole: "student",
  }
})
