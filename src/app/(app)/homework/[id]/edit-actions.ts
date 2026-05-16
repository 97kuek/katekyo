"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { z } from "zod"

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
  const session = await auth()
  if (!session || session.user.role !== "teacher") return { error: "権限がありません" }

  const result = editSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    dueDate: formData.get("dueDate"),
  })
  if (!result.success) return { error: result.error.issues[0].message }

  const { id, title, description, dueDate } = result.data

  const subjectIds = formData.getAll("subjectIds") as string[]

  const existing = await db.homework.findFirst({ where: { id, teacherId: session.user.id } })
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
  const session = await auth()
  if (!session || session.user.role !== "teacher") return { error: "権限がありません", success: false }

  const result = extendSchema.safeParse({
    id: formData.get("id"),
    dueDate: formData.get("dueDate"),
  })
  if (!result.success) return { error: result.error.issues[0].message, success: false }

  const { id, dueDate } = result.data

  const existing = await db.homework.findFirst({ where: { id, teacherId: session.user.id } })
  if (!existing) return { error: "宿題が見つかりません", success: false }

  await db.homework.update({
    where: { id },
    data: { dueDate: new Date(dueDate) },
  })

  revalidatePath(`/homework/${id}`)
  return { error: "", success: true }
}

export async function deleteHomework(formData: FormData) {
  const session = await auth()
  if (!session || session.user.role !== "teacher") redirect("/dashboard")

  const homeworkId = formData.get("homeworkId") as string
  if (!homeworkId) return

  await db.homework.deleteMany({ where: { id: homeworkId, teacherId: session.user.id } })
  revalidatePath("/homework")
  redirect("/homework")
}
