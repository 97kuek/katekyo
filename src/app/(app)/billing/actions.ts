"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { invalidateBilling } from "@/lib/cache-invalidation"
import { redirect } from "next/navigation"
import { z } from "zod"

const paymentKeySchema = z.object({
  studentId: z.string().min(1),
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
})

/**
 * セッション確認 → Zod バリデーション → テナント（teacherId）による生徒の所有権確認。
 * 検証に失敗した場合は null を返す。
 */
async function validatePaymentRequest(formData: FormData) {
  const session = await auth()
  if (!session || session.user.role !== "teacher") redirect("/dashboard")

  const result = paymentKeySchema.safeParse({
    studentId: formData.get("studentId"),
    year: formData.get("year"),
    month: formData.get("month"),
  })
  if (!result.success) return null

  const teacherId = session.user.id
  const { studentId, year, month } = result.data

  const student = await db.student.findFirst({
    where: { id: studentId, teacherId },
  })
  if (!student) return null

  return { teacherId, studentId, year, month }
}

export async function markAsPaid(formData: FormData) {
  const validated = await validatePaymentRequest(formData)
  if (!validated) return
  const { teacherId, studentId, year, month } = validated

  await db.monthlyPayment.upsert({
    where: { teacherId_studentId_year_month: { teacherId, studentId, year, month } },
    create: { teacherId, studentId, year, month, paidAt: new Date() },
    update: { paidAt: new Date() },
  })

  invalidateBilling({ teacherId, studentId })
}

export async function markAsUnpaid(formData: FormData) {
  const validated = await validatePaymentRequest(formData)
  if (!validated) return
  const { teacherId, studentId, year, month } = validated

  const existing = await db.monthlyPayment.findUnique({
    where: { teacherId_studentId_year_month: { teacherId, studentId, year, month } },
  })

  if (existing?.dueDate) {
    // 支払い期限が設定されている場合は paidAt だけリセット
    await db.monthlyPayment.update({
      where: { teacherId_studentId_year_month: { teacherId, studentId, year, month } },
      data: { paidAt: null },
    })
  } else {
    await db.monthlyPayment.deleteMany({
      where: { teacherId, studentId, year, month },
    })
  }

  invalidateBilling({ teacherId, studentId })
}

export async function setPaymentDueDate(formData: FormData) {
  const validated = await validatePaymentRequest(formData)
  if (!validated) return
  const { teacherId, studentId, year, month } = validated

  const dueDateResult = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .safeParse(formData.get("dueDate") || null)
  if (!dueDateResult.success) return
  const dueDateStr = dueDateResult.data

  if (!dueDateStr) {
    // 期限クリア: 未払いならレコードごと削除
    const existing = await db.monthlyPayment.findUnique({
      where: { teacherId_studentId_year_month: { teacherId, studentId, year, month } },
    })
    if (existing && !existing.paidAt) {
      await db.monthlyPayment.deleteMany({
        where: { teacherId, studentId, year, month },
      })
    } else if (existing) {
      await db.monthlyPayment.update({
        where: { teacherId_studentId_year_month: { teacherId, studentId, year, month } },
        data: { dueDate: null },
      })
    }
  } else {
    const dueDate = new Date(dueDateStr + "T00:00:00+09:00")
    await db.monthlyPayment.upsert({
      where: { teacherId_studentId_year_month: { teacherId, studentId, year, month } },
      create: { teacherId, studentId, year, month, dueDate },
      update: { dueDate },
    })
  }

  invalidateBilling({ teacherId, studentId })
}
