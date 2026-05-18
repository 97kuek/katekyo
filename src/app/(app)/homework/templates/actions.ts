"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const templateSchema = z.object({
  title: z.string().min(1, "タイトルを入力してください").max(100),
  description: z.string().optional(),
})

export async function createTemplate(
  _prevState: { error: string; timestamp?: number },
  formData: FormData
): Promise<{ error: string; timestamp?: number }> {
  const session = await auth()
  if (!session || session.user.role !== "teacher") return { error: "権限がありません" }

  const result = templateSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
  })
  if (!result.success) return { error: result.error.issues[0].message }

  await db.homeworkTemplate.create({
    data: {
      teacherId: session.user.id,
      title: result.data.title,
      description: result.data.description || null,
    },
  })

  revalidatePath("/homework/templates")
  return { error: "", timestamp: Date.now() }
}

export async function deleteTemplate(formData: FormData) {
  const session = await auth()
  if (!session || session.user.role !== "teacher") return

  const id = formData.get("id") as string
  if (!id) return

  await db.homeworkTemplate.deleteMany({ where: { id, teacherId: session.user.id } })
  revalidatePath("/homework/templates")
}
