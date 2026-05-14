"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export async function deleteStudent(formData: FormData) {
  const session = await auth()
  if (!session || session.user.role !== "teacher") redirect("/dashboard")

  const studentId = formData.get("studentId") as string
  if (!studentId) return

  const student = await db.student.findUnique({
    where: { id: studentId, teacherId: session.user.id },
    select: { userId: true },
  })
  if (!student) return

  await db.user.delete({ where: { id: student.userId } })
  revalidatePath("/students")
}
