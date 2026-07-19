"use server"

import { db } from "@/lib/db"
import { requireTeacher, requireStudent } from "@/lib/action-guards"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { deleteHomeworkPhoto, uploadHomeworkPhoto } from "@/lib/supabase-storage"
import { isPendingStatus } from "@/lib/homework-status"
import { plantForHomeworkApproval } from "@/lib/garden/actions"
import { sendLineMessage } from "@/lib/line"
import { submitHomeworkSchema } from "@/lib/validation"
import { validateTeacherSubjectIds } from "@/lib/tenant-validation"

const MAX_PHOTO_BYTES = 5 * 1024 * 1024

export async function submitHomework(
  _prevState: { error: string },
  formData: FormData
): Promise<{ error: string }> {
  const session = await auth()
  if (!session || session.user.role !== "student") {
    return { error: "権限がありません" }
  }

  const result = submitHomeworkSchema.safeParse({
    id: formData.get("id"),
    note: formData.get("note") || undefined,
    difficultyRating: formData.get("difficultyRating") || undefined,
  })
  if (!result.success) return { error: result.error.issues[0].message }

  const { id, note, difficultyRating } = result.data

  const student = await db.student.findUnique({ where: { userId: session.user.id } })
  if (!student) return { error: "生徒プロフィールが見つかりません" }

  const homework = await db.homework.findFirst({
    where: { id, studentId: student.id },
  })
  if (!homework) return { error: "宿題が見つかりません" }
  if (!isPendingStatus(homework.status)) {
    return { error: "この宿題は提出できません" }
  }

  const photoFile = formData.get("photo") as File | null
  const hasNewPhoto = photoFile instanceof File && photoFile.size > 0
  let photoUrl: string | null = null

  if (homework.requiresPhoto && !hasNewPhoto) {
    return { error: "写真の提出が必要です" }
  }

  if (hasNewPhoto) {
    if (photoFile.size > MAX_PHOTO_BYTES) return { error: "写真のサイズは5MB以内にしてください" }
    if (!photoFile.type.startsWith("image/")) return { error: "画像ファイルを選択してください" }
    try {
      photoUrl = await uploadHomeworkPhoto(photoFile, id)
    } catch (err) {
      console.error("[submitHomework] photo upload threw:", err)
      return { error: "写真のアップロードに失敗しました。Supabase Storageの設定を確認してください。" }
    }
    if (!photoUrl) return { error: "写真のアップロードに失敗しました。もう一度お試しください。" }
  }

  const submitted = await db.homework.updateMany({
    where: { id, studentId: student.id, status: homework.status },
    data: {
      status: "submitted",
      studentNote: note ?? null,
      difficultyRating: difficultyRating ?? null,
      photoUrl,
      submittedAt: new Date(),
    },
  })
  if (submitted.count !== 1) return { error: "この宿題は提出できません" }

  await db.homeworkEvent.create({
    data: {
      homeworkId: id,
      eventType: "submitted",
      actorName: session.user.name ?? "",
      note: note ?? null,
    },
  })

  const teacher = await db.user.findUnique({
    where: { id: homework.teacherId },
    select: { lineUserId: true },
  })
  if (teacher?.lineUserId) {
    const baseUrl = process.env.NEXTAUTH_URL ?? ""
    await sendLineMessage(
      teacher.lineUserId,
      `宿題が提出されました\n\n${session.user.name}さんが「${homework.title}」を提出しました。\n${baseUrl}/homework/${id}`
    )
  }

  redirect("/homework?view=waiting&toast=submitted")
}

const reviewSchema = z.object({
  id: z.string().min(1),
  action: z.enum(["approved", "rejected"]),
  feedback: z.string().optional(),
})

export async function reviewHomework(
  _prevState: { error: string },
  formData: FormData
): Promise<{ error: string }> {
  const teacher = await requireTeacher()
  if (!teacher) {
    return { error: "権限がありません" }
  }

  const result = reviewSchema.safeParse({
    id: formData.get("id"),
    action: formData.get("action"),
    feedback: formData.get("feedback") || undefined,
  })
  if (!result.success) return { error: result.error.issues[0].message }

  const { id, action, feedback } = result.data

  const homework = await db.homework.findFirst({
    where: { id, teacherId: teacher.teacherId },
  })
  if (!homework) return { error: "宿題が見つかりません" }
  if (homework.status !== "submitted") {
    return { error: "提出済みの宿題のみ確認できます" }
  }

  const updated = await db.homework.updateMany({
    where: { id, teacherId: teacher.teacherId, status: "submitted" },
    data: {
      status: action,
      teacherFeedback: feedback ?? null,
      reviewedAt: new Date(),
      feedbackSeenAt: null,
    },
  })
  if (updated.count !== 1) {
    return { error: "この宿題はすでに確認済みです" }
  }

  await db.homeworkEvent.create({
    data: {
      homeworkId: id,
      eventType: action,
      actorName: teacher.session.user.name ?? "",
      note: action === "rejected" ? (feedback ?? null) : null,
    },
  })

  // 承認・差し戻しいずれも生徒へ通知（一括承認と挙動を揃える）
  {
    const studentUser = await db.student.findUnique({
      where: { id: homework.studentId },
      include: { user: { select: { lineUserId: true } } },
    })
    if (studentUser?.user.lineUserId) {
      const baseUrl = process.env.NEXTAUTH_URL ?? ""
      let message: string
      if (action === "rejected") {
        message = `宿題が差し戻されました\n\n「${homework.title}」が差し戻されました。\n\nフィードバック：\n${feedback ?? "（なし）"}\n\n${baseUrl}/homework/${id}`
      } else {
        message = `宿題が承認されました\n\n「${homework.title}」が承認されました。\n森に植物が1つ育ちました。`
        if (feedback) message += `\n\n先生からのコメント：\n${feedback}`
        message += `\n\n${baseUrl}/homework/${id}`
      }
      await sendLineMessage(studentUser.user.lineUserId, message)
    }
  }

  if (action === "approved") {
    const wasRejectedEvent = await db.homeworkEvent.findFirst({
      where: { homeworkId: id, eventType: "rejected" },
      select: { id: true },
    })
    await plantForHomeworkApproval(homework, wasRejectedEvent !== null)
  }

  redirect(`/homework?view=${action === "approved" ? "completed" : "active"}&toast=reviewed`)
}

export async function markFeedbackSeen(homeworkId: string) {
  const guard = await requireStudent()
  if (!guard) return

  await db.homework.updateMany({
    where: { id: homeworkId, studentId: guard.student.id, feedbackSeenAt: null },
    data: { feedbackSeenAt: new Date() },
  })

  revalidatePath("/dashboard")
}

export async function cancelSubmission(formData: FormData) {
  const guard = await requireStudent()
  if (!guard) redirect("/dashboard")

  const homeworkId = formData.get("homeworkId") as string
  if (!homeworkId) return

  const homework = await db.homework.findFirst({
    where: { id: homeworkId, studentId: guard.student.id, status: "submitted" },
  })
  if (!homework) return

  if (homework.photoUrl) {
    await deleteHomeworkPhoto(homework.photoUrl).catch((err) => {
      console.error("[cancelSubmission] photo delete failed:", err)
    })
  }

  await db.homework.updateMany({
    where: { id: homeworkId, studentId: guard.student.id, status: "submitted" },
    data: {
      status: "assigned",
      submittedAt: null,
      studentNote: null,
      difficultyRating: null,
      photoUrl: null,
    },
  })

  revalidatePath("/homework")
  revalidatePath(`/homework/${homeworkId}`)
}

const editSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1, "タイトルを入力してください"),
  description: z.string().optional(),
  dueDate: z.string().min(1, "期限を設定してください"),
})

export async function updateHomework(
  _prevState: { error: string },
  formData: FormData
): Promise<{ error: string }> {
  const teacher = await requireTeacher()
  if (!teacher) return { error: "権限がありません" }

  const result = editSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    dueDate: formData.get("dueDate"),
  })
  if (!result.success) return { error: result.error.issues[0].message }

  const { id, title, description, dueDate } = result.data

  const subjectIds = await validateTeacherSubjectIds(teacher.teacherId, formData.getAll("subjectIds") as string[])
  if (!subjectIds) return { error: "無効な科目が含まれています" }

  const existing = await db.homework.findFirst({ where: { id, teacherId: teacher.teacherId } })
  if (!existing) return { error: "宿題が見つかりません" }

  await db.homework.update({
    where: { id },
    data: { title, description: description ?? null, dueDate: new Date(dueDate), subjectIds },
  })

  redirect(`/homework/${id}`)
}

const extendSchema = z.object({
  id: z.string().min(1),
  dueDate: z.string().min(1, "期限を入力してください"),
})

export async function extendDueDate(
  _prevState: { error: string; success: boolean },
  formData: FormData
): Promise<{ error: string; success: boolean }> {
  const teacher = await requireTeacher()
  if (!teacher) return { error: "権限がありません", success: false }

  const result = extendSchema.safeParse({
    id: formData.get("id"),
    dueDate: formData.get("dueDate"),
  })
  if (!result.success) return { error: result.error.issues[0].message, success: false }

  const { id, dueDate } = result.data

  const existing = await db.homework.findFirst({ where: { id, teacherId: teacher.teacherId } })
  if (!existing) return { error: "宿題が見つかりません", success: false }

  await db.homework.update({
    where: { id },
    data: { dueDate: new Date(dueDate) },
  })

  revalidatePath(`/homework/${id}`)
  return { error: "", success: true }
}

export async function deleteHomework(formData: FormData) {
  const teacher = await requireTeacher()
  if (!teacher) redirect("/dashboard")

  const homeworkId = formData.get("homeworkId") as string
  if (!homeworkId) return

  await db.homework.deleteMany({ where: { id: homeworkId, teacherId: teacher.teacherId } })
  revalidatePath("/homework")
  redirect("/homework")
}
