"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { plantGardenItem } from "@/lib/garden"
import { sendLineMessage } from "@/lib/line"
import type { GardenItemType } from "@/lib/garden-utils"

export async function bulkApproveHomework(ids: string[]): Promise<{ error: string }> {
  const session = await auth()
  if (!session || session.user.role !== "teacher") return { error: "権限がありません" }

  if (!ids.length) return { error: "" }

  const homeworks = await db.homework.findMany({
    where: {
      id: { in: ids },
      teacherId: session.user.id,
      status: "submitted",
    },
    include: {
      student: { include: { user: { select: { lineUserId: true } } } },
    },
  })

  if (!homeworks.length) return { error: "" }

  const now = new Date()
  await db.homework.updateMany({
    where: { id: { in: homeworks.map((h) => h.id) } },
    data: { status: "approved", reviewedAt: now },
  })

  const baseUrl = process.env.NEXTAUTH_URL ?? ""

  await Promise.all(
    homeworks.map(async (homework) => {
      const lineUserId = homework.student.user.lineUserId
      if (lineUserId) {
        await sendLineMessage(
          lineUserId,
          `✅ 宿題が承認されました\n\n「${homework.title}」が承認されました！\n森に植物が1つ育ちました 🌱\n${baseUrl}/homework/${homework.id}`
        )
      }

      const wasRejected = homework.reviewedAt !== null
      const wasLate = homework.submittedAt != null && homework.submittedAt > homework.dueDate
      if (!wasRejected && !wasLate) {
        try {
          const approvedCount = await db.homework.count({
            where: { studentId: homework.studentId, status: "approved" },
          })
          const forcedType: GardenItemType | undefined = approvedCount % 5 === 0 ? "big_tree" : undefined
          await plantGardenItem(homework.studentId, forcedType)
        } catch (err) {
          console.error("[garden] plantGardenItem failed:", err)
        }
      }
    })
  )

  revalidatePath("/homework")
  return { error: "" }
}
