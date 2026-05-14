"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { GRADE_OPTIONS } from "@/lib/grades"

const schema = z.object({
  studentId: z.string().min(1),
  grade: z.enum(GRADE_OPTIONS as unknown as [string, ...string[]], { error: "学年を選択してください" }),
})

export async function updateStudentGrade(formData: FormData) {
  const session = await auth()
  if (!session || session.user.role !== "teacher") redirect("/dashboard")

  const result = schema.safeParse({
    studentId: formData.get("studentId"),
    grade: formData.get("grade"),
  })
  if (!result.success) return

  const { studentId, grade } = result.data

  await db.student.updateMany({
    where: { id: studentId, teacherId: session.user.id },
    data: { grade },
  })

  revalidatePath("/students")
}
