"use server"

import { db } from "@/lib/db"
import { requireTeacher } from "@/lib/action-guards"
import { invalidateParentStudents, invalidateStudent } from "@/lib/cache-invalidation"
import { z } from "zod"

export async function unlinkParent(
  _prevState: { error: string },
  formData: FormData
): Promise<{ error: string }> {
  const teacher = await requireTeacher()
  if (!teacher) return { error: "権限がありません" }

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
    where: { parentId, studentId, teacherId: teacher.teacherId },
  })
  if (!link) return { error: "対象が見つかりません" }

  await db.parentStudent.delete({ where: { id: link.id } })
  invalidateParentStudents(parentId)
  invalidateStudent({ teacherId: teacher.teacherId, studentId })
  return { error: "" }
}
