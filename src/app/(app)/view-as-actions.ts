"use server"

import { cookies } from "next/headers"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"

const COOKIE_NAME = "katekyo_view_as"

export async function startViewingAs(studentId: string) {
  const session = await auth()
  if (!session || session.user.role !== "teacher") return

  const student = await db.student.findFirst({
    where: { id: studentId, teacherId: session.user.id },
    select: { id: true },
  })
  if (!student) return

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, studentId, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60,
    path: "/",
  })

  redirect("/dashboard")
}

export async function stopViewingAs() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
  redirect("/students")
}
