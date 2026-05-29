"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"

export async function unlinkParent(
  _prevState: { error: string },
  formData: FormData
): Promise<{ error: string }> {
  const session = await auth()
  if (!session || session.user.role !== "teacher") return { error: "権限がありません" }

  const schema = z.object({
    parentId: z.string().min(1),
    studentId: z.string().min(1),
  })
  const result = schema.safeParse({
    parentId: formData.get("parentId"),
    studentId: formData.get("studentId"),
  })
  if (!result.success) return { error: "不正なリクエストです" }

  const { parentId, studentId } = result.data

  // 先生のテナント確認
  const link = await db.parentStudent.findFirst({
    where: { parentId, studentId, teacherId: session.user.id },
  })
  if (!link) return { error: "対象が見つかりません" }

  await db.parentStudent.delete({ where: { id: link.id } })
  revalidatePath(`/students/${studentId}/parents`)
  return { error: "" }
}
