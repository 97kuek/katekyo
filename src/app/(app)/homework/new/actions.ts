"use server"

import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { z } from "zod"
import { sendLineMessage } from "@/lib/line"

const schema = z.object({
  studentId: z.string().min(1, "生徒を選択してください"),
  title: z.string().min(1, "タイトルを入力してください"),
  description: z.string().optional(),
  dueDate: z.string().min(1, "期限を設定してください"),
  materialId: z.string().optional(),
  requiresPhoto: z.string().optional(),
})

export async function createHomework(
  _prevState: { error: string },
  formData: FormData
): Promise<{ error: string }> {
  const session = await auth()
  if (!session || session.user.role !== "teacher") {
    return { error: "権限がありません" }
  }

  const result = schema.safeParse({
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
  const subjectIds = formData.getAll("subjectIds") as string[]

  const student = await db.student.findFirst({
    where: { id: studentId, teacherId: session.user.id },
    include: { user: { select: { lineUserId: true } } },
  })
  if (!student) {
    return { error: "指定された生徒が見つかりません" }
  }

  if (materialId) {
    const material = await db.studentMaterial.findFirst({
      where: { id: materialId, teacherId: session.user.id },
    })
    if (!material) {
      return { error: "指定された教材が見つかりません" }
    }
  }

  const homework = await db.homework.create({
    data: {
      teacherId: session.user.id,
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
      `📝 新しい宿題が追加されました\n\n「${title}」\n期限: ${dueStr}\n\n${baseUrl}/homework/${homework.id}`
    )
  }

  redirect("/homework")
}
