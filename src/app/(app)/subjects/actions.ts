"use server"

import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(1, "科目名を入力してください").max(50, "科目名は50文字以内で入力してください"),
})

export async function createSubject(
  _prevState: { error: string; success: boolean },
  formData: FormData
): Promise<{ error: string; success: boolean }> {
  const session = await auth()
  if (!session || session.user.role !== "teacher") {
    return { error: "権限がありません", success: false }
  }

  const result = schema.safeParse({ name: formData.get("name") })
  if (!result.success) return { error: result.error.issues[0].message, success: false }

  const { name } = result.data

  const existing = await db.subject.findFirst({
    where: { name, teacherId: session.user.id },
  })
  if (existing) return { error: "この科目名は既に存在します", success: false }

  await db.subject.create({ data: { name, teacherId: session.user.id } })
  revalidatePath("/settings")
  return { error: "", success: true }
}

export async function deleteSubject(formData: FormData) {
  const session = await auth()
  if (!session || session.user.role !== "teacher") return

  const id = formData.get("id") as string
  await db.subject.deleteMany({ where: { id, teacherId: session.user.id } })
  revalidatePath("/settings")
}
