"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { scheduleReminderMessage, cancelReminderMessage } from "@/lib/qstash"
import { uploadTempMaterial } from "@/lib/supabase-storage"
import { sendLineImageWithCaption } from "@/lib/line"

const createSchema = z.object({
  studentId: z.string().min(1, "生徒を選択してください"),
  date: z.string().min(1, "日付を入力してください"),
  time: z.string().min(1, "時刻を入力してください"),
  type: z.enum(["online", "offline"]),
  durationMin: z.string().optional(),
  notes: z.string().optional(),
  hourlyRate: z.coerce.number().int().min(0).optional(),
  travelExpense: z.coerce.number().int().min(0).optional(),
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
    hourlyRate: formData.get("hourlyRate") || undefined,
    travelExpense: formData.get("travelExpense") || undefined,
    repeatWeeks: formData.get("repeatWeeks") || undefined,
  })
  if (!result.success) return { error: result.error.issues[0].message }

  const { studentId, date, time, type, durationMin, notes, hourlyRate, travelExpense, repeatWeeks } = result.data

  const student = await db.student.findFirst({ where: { id: studentId, teacherId: session.user.id } })
  if (!student) return { error: "生徒が見つかりません" }

  const baseTime = new Date(`${date}T${time}:00+09:00`)
  const weeks = Math.min(Math.max(parseInt(repeatWeeks ?? "0") || 0, 0), 52)
  const dates = Array.from({ length: weeks + 1 }, (_, i) => {
    const d = new Date(baseTime)
    d.setDate(d.getDate() + i * 7)
    return d
  })

  const effectiveTravelExpense = type === "online" ? 0 : (travelExpense ?? null)
  const subjectIds = formData.getAll("subjectIds") as string[]

  const teacher = type === "online"
    ? await db.user.findUnique({ where: { id: session.user.id }, select: { meetLink: true } })
    : null

  const lessons = await Promise.all(
    dates.map((dateTime) =>
      db.lesson.create({
        data: {
          teacherId: session.user.id,
          studentId,
          date: dateTime,
          type,
          durationMin: durationMin ? parseInt(durationMin) : null,
          notes: notes || null,
          subjectIds,
          hourlyRate: hourlyRate ?? null,
          travelExpense: effectiveTravelExpense,
        },
      })
    )
  )

  if (type === "online" && teacher?.meetLink) {
    await Promise.all(
      lessons.map(async (lesson) => {
        const messageId = await scheduleReminderMessage(lesson.id, lesson.date)
        if (messageId) {
          await db.lesson.update({ where: { id: lesson.id }, data: { qstashMessageId: messageId } })
        }
      })
    )
  }

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
  lessonLog: z.string().optional(),
  hourlyRate: z.coerce.number().int().min(0).optional(),
  travelExpense: z.coerce.number().int().min(0).optional(),
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
    lessonLog: formData.get("lessonLog") || undefined,
    hourlyRate: formData.get("hourlyRate") || undefined,
    travelExpense: formData.get("travelExpense") || undefined,
  })
  if (!result.success) return { error: result.error.issues[0].message }

  const { lessonId, date, time, type, durationMin, notes, lessonLog, hourlyRate, travelExpense } = result.data
  const effectiveTravelExpense = type === "online" ? 0 : (travelExpense ?? null)
  const lessonLogPublic = formData.get("lessonLogPublic") === "on"
  const subjectIds = formData.getAll("subjectIds") as string[]
  const newDate = new Date(`${date}T${time}:00+09:00`)

  const existing = await db.lesson.findFirst({
    where: { id: lessonId, teacherId: session.user.id },
    select: { qstashMessageId: true },
  })
  if (!existing) return { error: "授業が見つかりません" }

  if (existing.qstashMessageId) {
    await cancelReminderMessage(existing.qstashMessageId)
  }

  const updated = await db.lesson.update({
    where: { id: lessonId },
    data: {
      date: newDate,
      type,
      durationMin: durationMin ? parseInt(durationMin) : null,
      notes: notes || null,
      lessonLog: lessonLog || null,
      lessonLogPublic,
      subjectIds,
      hourlyRate: hourlyRate ?? null,
      travelExpense: effectiveTravelExpense,
      qstashMessageId: null,
    },
  })

  if (type === "online") {
    const teacher = await db.user.findUnique({ where: { id: session.user.id }, select: { meetLink: true } })
    if (teacher?.meetLink) {
      const messageId = await scheduleReminderMessage(updated.id, updated.date)
      if (messageId) {
        await db.lesson.update({ where: { id: updated.id }, data: { qstashMessageId: messageId } })
      }
    }
  }

  revalidatePath("/calendar")
  return { error: "", timestamp: Date.now() }
}

export async function deleteLesson(formData: FormData) {
  const session = await auth()
  if (!session || session.user.role !== "teacher") redirect("/dashboard")

  const lessonId = formData.get("lessonId") as string
  if (!lessonId) return

  const lesson = await db.lesson.findFirst({
    where: { id: lessonId, teacherId: session.user.id },
    select: { qstashMessageId: true },
  })
  if (lesson?.qstashMessageId) {
    await cancelReminderMessage(lesson.qstashMessageId)
  }

  await db.lesson.deleteMany({ where: { id: lessonId, teacherId: session.user.id } })
  revalidatePath("/calendar")
}

export async function completeLesson(formData: FormData) {
  const session = await auth()
  if (!session || session.user.role !== "teacher") redirect("/dashboard")

  const lessonId = formData.get("lessonId") as string
  if (!lessonId) return
  const lessonLog = (formData.get("lessonLog") as string) || null

  await db.lesson.updateMany({
    where: { id: lessonId, teacherId: session.user.id, completedAt: null },
    data: { completedAt: new Date(), ...(lessonLog ? { lessonLog } : {}) },
  })
  revalidatePath("/calendar")
  revalidatePath("/dashboard")
  revalidatePath("/billing")
}

export async function uncompleteLesson(formData: FormData) {
  const session = await auth()
  if (!session || session.user.role !== "teacher") redirect("/dashboard")

  const lessonId = formData.get("lessonId") as string
  if (!lessonId) return

  await db.lesson.updateMany({
    where: { id: lessonId, teacherId: session.user.id },
    data: { completedAt: null },
  })
  revalidatePath("/calendar")
  revalidatePath("/dashboard")
  revalidatePath("/billing")
}

const examEventSchema = z.object({
  studentId: z.string().min(1, "生徒を選択してください"),
  date: z.string().min(1, "日付を入力してください"),
  name: z.string().min(1, "テスト名を入力してください"),
  testType: z.enum(["mock", "exam", "quiz", "other"]).default("exam"),
})

export async function createExamEvent(
  _prevState: { error: string; timestamp?: number },
  formData: FormData
): Promise<{ error: string; timestamp?: number }> {
  const session = await auth()
  if (!session || session.user.role !== "teacher") return { error: "権限がありません" }

  const result = examEventSchema.safeParse({
    studentId: formData.get("studentId"),
    date: formData.get("date"),
    name: formData.get("name"),
    testType: formData.get("testType") || "exam",
  })
  if (!result.success) return { error: result.error.issues[0].message }

  const { studentId, date, name, testType } = result.data

  const student = await db.student.findFirst({ where: { id: studentId, teacherId: session.user.id } })
  if (!student) return { error: "生徒が見つかりません" }

  await db.examEvent.create({
    data: {
      teacherId: session.user.id,
      studentId,
      date: new Date(`${date}T00:00:00+09:00`),
      name,
      testType,
    },
  })

  revalidatePath("/calendar")
  revalidatePath("/dashboard")
  return { error: "", timestamp: Date.now() }
}

export async function deleteExamEvent(formData: FormData) {
  const session = await auth()
  if (!session || session.user.role !== "teacher") redirect("/dashboard")

  const examEventId = formData.get("examEventId") as string
  if (!examEventId) return

  await db.examEvent.deleteMany({ where: { id: examEventId, teacherId: session.user.id } })
  revalidatePath("/calendar")
  revalidatePath("/dashboard")
}

const calendarHomeworkSchema = z.object({
  studentId: z.string().min(1, "生徒を選択してください"),
  title: z.string().min(1, "タイトルを入力してください"),
  dueDate: z.string().min(1, "期限を設定してください"),
})

export async function createHomeworkFromCalendar(
  _prevState: { error: string; timestamp?: number },
  formData: FormData
): Promise<{ error: string; timestamp?: number }> {
  const session = await auth()
  if (!session || session.user.role !== "teacher") return { error: "権限がありません" }

  const result = calendarHomeworkSchema.safeParse({
    studentId: formData.get("studentId"),
    title: formData.get("title"),
    dueDate: formData.get("dueDate"),
  })
  if (!result.success) return { error: result.error.issues[0].message }

  const { studentId, title, dueDate } = result.data
  const student = await db.student.findFirst({ where: { id: studentId, teacherId: session.user.id } })
  if (!student) return { error: "生徒が見つかりません" }

  await db.homework.create({
    data: {
      teacherId: session.user.id,
      studentId,
      title,
      dueDate: new Date(`${dueDate}T00:00:00+09:00`),
      subjectIds: [],
    },
  })

  revalidatePath("/calendar")
  revalidatePath("/homework")
  return { error: "", timestamp: Date.now() }
}

const MAX_MATERIAL_BYTES = 5 * 1024 * 1024

export async function sendMaterialPhoto(
  formData: FormData
): Promise<{ error?: string; url?: string; sent?: boolean }> {
  const session = await auth()
  if (!session || session.user.role !== "student") return { error: "権限がありません" }

  const lessonId = formData.get("lessonId") as string
  const photoFile = formData.get("photo") as File | null

  if (!photoFile || photoFile.size === 0) return { error: "写真を選択してください" }
  if (photoFile.size > MAX_MATERIAL_BYTES) return { error: "写真は5MB以内にしてください" }
  if (!photoFile.type.startsWith("image/")) return { error: "画像ファイルを選択してください" }

  const student = await db.student.findFirst({
    where: { userId: session.user.id },
    select: { id: true, teacher: { select: { lineUserId: true } } },
  })
  if (!student) return { error: "生徒プロフィールが見つかりません" }

  const lesson = await db.lesson.findFirst({
    where: { id: lessonId, studentId: student.id },
  })
  if (!lesson) return { error: "授業が見つかりません" }

  const url = await uploadTempMaterial(photoFile)
  if (!url) return { error: "写真のアップロードに失敗しました" }

  const teacherLineUserId = student.teacher.lineUserId
  if (teacherLineUserId) {
    await sendLineImageWithCaption(
      teacherLineUserId,
      url,
      `📷 ${session.user.name} さんから教材が届きました`
    )
    return { url, sent: true }
  }

  return { url, sent: false }
}
