"use server"

import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { z } from "zod"
import { uploadHomeworkPhoto } from "@/lib/supabase-storage"
import { plantGardenItem } from "@/lib/garden"

const MAX_PHOTO_BYTES = 5 * 1024 * 1024

const submitSchema = z.object({
  id: z.string().min(1),
  note: z.string().optional(),
})

export async function submitHomework(
  _prevState: { error: string },
  formData: FormData
): Promise<{ error: string }> {
  const session = await auth()
  if (!session || session.user.role !== "student") {
    return { error: "権限がありません" }
  }

  const result = submitSchema.safeParse({
    id: formData.get("id"),
    note: formData.get("note") || undefined,
  })
  if (!result.success) return { error: result.error.issues[0].message }

  const { id, note } = result.data

  const student = await db.student.findUnique({ where: { userId: session.user.id } })
  if (!student) return { error: "生徒プロフィールが見つかりません" }

  const homework = await db.homework.findFirst({
    where: { id, studentId: student.id },
  })
  if (!homework) return { error: "宿題が見つかりません" }
  if (!["assigned", "rejected"].includes(homework.status)) {
    return { error: "この宿題は提出できません" }
  }

  const photoFile = formData.get("photo") as File | null
  let photoUrl: string | null = null

  if (photoFile && photoFile.size > 0) {
    if (photoFile.size > MAX_PHOTO_BYTES) return { error: "写真のサイズは5MB以内にしてください" }
    if (!photoFile.type.startsWith("image/")) return { error: "画像ファイルを選択してください" }
    photoUrl = await uploadHomeworkPhoto(photoFile, id)
    if (!photoUrl) return { error: "写真のアップロードに失敗しました。もう一度お試しください。" }
  }

  await db.homework.update({
    where: { id },
    data: {
      status: "submitted",
      studentNote: note ?? null,
      photoUrl,
      submittedAt: new Date(),
    },
  })

  redirect("/homework?toast=submitted")
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
  const session = await auth()
  if (!session || session.user.role !== "teacher") {
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
    where: { id, teacherId: session.user.id },
  })
  if (!homework) return { error: "宿題が見つかりません" }
  if (homework.status !== "submitted") {
    return { error: "提出済みの宿題のみ確認できます" }
  }

  await db.homework.update({
    where: { id },
    data: { status: action, teacherFeedback: feedback ?? null, reviewedAt: new Date() },
  })

  if (action === "approved") {
    try {
      await plantGardenItem(homework.studentId)
    } catch (err) {
      console.error("[garden] plantGardenItem failed:", err)
    }
  }

  redirect("/homework?toast=reviewed")
}

