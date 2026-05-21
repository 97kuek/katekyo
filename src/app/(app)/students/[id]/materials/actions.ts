"use server"

import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { z } from "zod"
import { revalidatePath } from "next/cache"

const createSchema = z.object({
  studentId: z.string().min(1),
  name: z.string().min(1, "教材名を入力してください").max(100),
  note: z.string().max(200).optional(),
})

export async function createMaterial(
  _prevState: { error: string },
  formData: FormData
): Promise<{ error: string }> {
  const session = await auth()
  if (!session || session.user.role !== "teacher") return { error: "権限がありません" }

  const result = createSchema.safeParse({
    studentId: formData.get("studentId"),
    name: formData.get("name"),
    note: formData.get("note") || undefined,
  })
  if (!result.success) return { error: result.error.issues[0].message }

  const { studentId, name, note } = result.data
  const subjectIds = formData.getAll("subjectId") as string[]

  const student = await db.student.findFirst({
    where: { id: studentId, teacherId: session.user.id },
  })
  if (!student) return { error: "生徒が見つかりません" }

  await db.studentMaterial.create({
    data: { studentId, teacherId: session.user.id, name, note: note ?? null, subjectIds },
  })

  revalidatePath(`/students/${studentId}/materials`)
  return { error: "" }
}

export async function deleteMaterial(materialId: string, studentId: string): Promise<{ error: string }> {
  const session = await auth()
  if (!session || session.user.role !== "teacher") return { error: "権限がありません" }

  await db.studentMaterial.deleteMany({
    where: { id: materialId, teacherId: session.user.id },
  })

  revalidatePath(`/students/${studentId}/materials`)
  return { error: "" }
}
