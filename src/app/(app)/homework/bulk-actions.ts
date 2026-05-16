"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function bulkApproveHomework(ids: string[]): Promise<{ error: string }> {
  const session = await auth()
  if (!session || session.user.role !== "teacher") return { error: "権限がありません" }

  if (!ids.length) return { error: "" }

  await db.homework.updateMany({
    where: {
      id: { in: ids },
      teacherId: session.user.id,
      status: "submitted",
    },
    data: { status: "approved", reviewedAt: new Date() },
  })

  revalidatePath("/homework")
  return { error: "" }
}
