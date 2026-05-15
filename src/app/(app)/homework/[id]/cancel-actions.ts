"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function cancelSubmission(formData: FormData) {
  const session = await auth()
  if (!session || session.user.role !== "student") redirect("/dashboard")

  const homeworkId = formData.get("homeworkId") as string
  if (!homeworkId) return

  const student = await db.student.findUnique({ where: { userId: session.user.id } })
  if (!student) redirect("/dashboard")

  const homework = await db.homework.findFirst({
    where: { id: homeworkId, studentId: student.id, status: "submitted" },
  })
  if (!homework) return

  await db.homework.update({
    where: { id: homeworkId },
    data: { status: "assigned", submittedAt: null, studentNote: null },
  })

  revalidatePath("/homework")
  revalidatePath(`/homework/${homeworkId}`)
}
