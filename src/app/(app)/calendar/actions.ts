"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const createSchema = z.object({
  studentId: z.string().min(1, "生徒を選択してください"),
  date: z.string().min(1, "日付を入力してください"),
  time: z.string().min(1, "時刻を入力してください"),
  type: z.enum(["online", "offline"]),
  durationMin: z.string().optional(),
  notes: z.string().optional(),
  repeatWeeks: z.string().optional(),
})

export async function createLesson(
  _prevState: { error: string; timestamp?: number },
  formData: FormData
): Promise<{ error: string; timestamp?: number }> {
  const session = await auth()
  if (!session || session.user.role !== "teacher") return { error: "権限がありません" }

  const result = createSchema.safeParse({
    studentId: formData.get("studentId"),
    date: formData.get("date"),
    time: formData.get("time"),
    type: formData.get("type"),
    durationMin: formData.get("durationMin") || undefined,
    notes: formData.get("notes") || undefined,
    repeatWeeks: formData.get("repeatWeeks") || undefined,
  })
  if (!result.success) return { error: result.error.issues[0].message }

  const { studentId, date, time, type, durationMin, notes, repeatWeeks } = result.data

  const student = await db.student.findFirst({ where: { id: studentId, teacherId: session.user.id } })
  if (!student) return { error: "生徒が見つかりません" }

  const baseTime = new Date(`${date}T${time}:00+09:00`)
  const weeks = Math.min(Math.max(parseInt(repeatWeeks ?? "0") || 0, 0), 52)
  const dates = Array.from({ length: weeks + 1 }, (_, i) => {
    const d = new Date(baseTime)
    d.setDate(d.getDate() + i * 7)
    return d
  })

  await db.lesson.createMany({
    data: dates.map((dateTime) => ({
      teacherId: session.user.id,
      studentId,
      date: dateTime,
      type,
      durationMin: durationMin ? parseInt(durationMin) : null,
      notes: notes || null,
    })),
  })

  revalidatePath("/calendar")
  return { error: "", timestamp: Date.now() }
}

const updateSchema = z.object({
  lessonId: z.string().min(1),
  date: z.string().min(1),
  time: z.string().min(1),
  type: z.enum(["online", "offline"]),
  durationMin: z.string().optional(),
  notes: z.string().optional(),
})

export async function updateLesson(
  _prevState: { error: string; timestamp?: number },
  formData: FormData
): Promise<{ error: string; timestamp?: number }> {
  const session = await auth()
  if (!session || session.user.role !== "teacher") return { error: "権限がありません" }

  const result = updateSchema.safeParse({
    lessonId: formData.get("lessonId"),
    date: formData.get("date"),
    time: formData.get("time"),
    type: formData.get("type"),
    durationMin: formData.get("durationMin") || undefined,
    notes: formData.get("notes") || undefined,
  })
  if (!result.success) return { error: result.error.issues[0].message }

  const { lessonId, date, time, type, durationMin, notes } = result.data

  await db.lesson.updateMany({
    where: { id: lessonId, teacherId: session.user.id },
    data: {
      date: new Date(`${date}T${time}:00+09:00`),
      type,
      durationMin: durationMin ? parseInt(durationMin) : null,
      notes: notes || null,
    },
  })

  revalidatePath("/calendar")
  return { error: "", timestamp: Date.now() }
}

export async function deleteLesson(formData: FormData) {
  const session = await auth()
  if (!session || session.user.role !== "teacher") redirect("/dashboard")

  const lessonId = formData.get("lessonId") as string
  if (!lessonId) return

  await db.lesson.deleteMany({ where: { id: lessonId, teacherId: session.user.id } })
  revalidatePath("/calendar")
}
