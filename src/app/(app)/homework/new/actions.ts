"use server"

import { db } from "@/lib/db"
import { requireTeacher } from "@/lib/action-guards"
import { redirect } from "next/navigation"
import { sendLineMessage } from "@/lib/line"
import { createHomeworkSchema } from "@/lib/validation"
import { validateTeacherSubjectIds } from "@/lib/tenant-validation"

export async function createHomework(
  _prevState: { error: string },
  formData: FormData
): Promise<{ error: string }> {
  const teacher = await requireTeacher()
  if (!teacher) {
    return { error: "権限がありません" }
  }

  const result = createHomeworkSchema.safeParse({
    studentId: formData.get("studentId"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    dueDate: formData.get("dueDate"),
    materialId: formData.get("materialId") || undefined,
    requiresPhoto: formData.get("requiresPhoto") || undefined,
  })

  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const { studentId, title, description, dueDate, materialId, requiresPhoto } = result.data
  const subjectIds = await validateTeacherSubjectIds(teacher.teacherId, formData.getAll("subjectIds") as string[])
  if (!subjectIds) return { error: "無効な科目が含まれています" }

  const student = await db.student.findFirst({
    where: { id: studentId, teacherId: teacher.teacherId },
    include: { user: { select: { lineUserId: true } } },
  })
  if (!student) {
    return { error: "指定された生徒が見つかりません" }
  }

  if (materialId) {
    const material = await db.studentMaterial.findFirst({
      where: { id: materialId, teacherId: teacher.teacherId, studentId },
    })
    if (!material) {
      return { error: "指定された教材が見つかりません" }
    }
  }

  const homework = await db.homework.create({
    data: {
      teacherId: teacher.teacherId,
      studentId,
      title,
      description: description || null,
      dueDate: new Date(dueDate),
      subjectIds,
      materialId: materialId || null,
      requiresPhoto: requiresPhoto === "1",
    },
  })

  if (student.user.lineUserId) {
    const dueStr = new Date(dueDate).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric", timeZone: "Asia/Tokyo" })
    const baseUrl = process.env.NEXTAUTH_URL ?? ""
    await sendLineMessage(
      student.user.lineUserId,
      `新しい宿題が追加されました\n\n「${title}」\n期限: ${dueStr}\n\n${baseUrl}/homework/${homework.id}`
    )
  }

  redirect("/homework")
}
