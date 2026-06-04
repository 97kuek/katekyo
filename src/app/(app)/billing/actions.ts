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

  const student = await db.student.findFirst({
    where: { id: studentId, teacherId: session.user.id },
  })
  if (!student) return

  await db.monthlyPayment.upsert({
    where: { teacherId_studentId_year_month: { teacherId: session.user.id, studentId, year, month } },
    create: { teacherId: session.user.id, studentId, year, month, paidAt: new Date() },
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

  const student = await db.student.findFirst({
    where: { id: studentId, teacherId: session.user.id },
  })
  if (!student) return

  const existing = await db.monthlyPayment.findUnique({
    where: { teacherId_studentId_year_month: { teacherId: session.user.id, studentId, year, month } },
  })

  if (existing?.dueDate) {
    // 支払い期限が設定されている場合は paidAt だけリセット
    await db.monthlyPayment.update({
      where: { teacherId_studentId_year_month: { teacherId: session.user.id, studentId, year, month } },
      data: { paidAt: null },
    })
  } else {
    await db.monthlyPayment.deleteMany({
      where: { teacherId: session.user.id, studentId, year, month },
    })
  }

  revalidatePath("/billing")
}

export async function setPaymentDueDate(formData: FormData) {
  const session = await auth()
  if (!session || session.user.role !== "teacher") redirect("/dashboard")

  const studentId = formData.get("studentId") as string
  const year = parseInt(formData.get("year") as string)
  const month = parseInt(formData.get("month") as string)
  const dueDateStr = formData.get("dueDate") as string | null

  const student = await db.student.findFirst({
    where: { id: studentId, teacherId: session.user.id },
  })
  if (!student) return

  if (!dueDateStr) {
    // 期限クリア: 未払いならレコードごと削除
    const existing = await db.monthlyPayment.findUnique({
      where: { teacherId_studentId_year_month: { teacherId: session.user.id, studentId, year, month } },
    })
    if (existing && !existing.paidAt) {
      await db.monthlyPayment.deleteMany({
        where: { teacherId: session.user.id, studentId, year, month },
      })
    } else if (existing) {
      await db.monthlyPayment.update({
        where: { teacherId_studentId_year_month: { teacherId: session.user.id, studentId, year, month } },
        data: { dueDate: null },
      })
    }
  } else {
    const dueDate = new Date(dueDateStr + "T00:00:00+09:00")
    await db.monthlyPayment.upsert({
      where: { teacherId_studentId_year_month: { teacherId: session.user.id, studentId, year, month } },
      create: { teacherId: session.user.id, studentId, year, month, dueDate },
      update: { dueDate },
    })
  }

  revalidatePath("/billing")
}
