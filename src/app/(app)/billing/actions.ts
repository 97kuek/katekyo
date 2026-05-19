"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export async function markAsPaid(formData: FormData) {
  const session = await auth()
  if (!session || session.user.role !== "teacher") redirect("/dashboard")

  const studentId = formData.get("studentId") as string
  const year = parseInt(formData.get("year") as string)
  const month = parseInt(formData.get("month") as string)

  await db.monthlyPayment.upsert({
    where: { teacherId_studentId_year_month: { teacherId: session.user.id, studentId, year, month } },
    create: { teacherId: session.user.id, studentId, year, month },
    update: { paidAt: new Date() },
  })

  revalidatePath("/billing")
}

export async function markAsUnpaid(formData: FormData) {
  const session = await auth()
  if (!session || session.user.role !== "teacher") redirect("/dashboard")

  const studentId = formData.get("studentId") as string
  const year = parseInt(formData.get("year") as string)
  const month = parseInt(formData.get("month") as string)

  await db.monthlyPayment.deleteMany({
    where: { teacherId: session.user.id, studentId, year, month },
  })

  revalidatePath("/billing")
}
