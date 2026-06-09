"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { plantForHomeworkApproval } from "@/lib/garden/actions"
import { sendLineMessage } from "@/lib/line"

export async function bulkApproveHomework(ids: string[]): Promise<{ error: string; approved: number }> {
  const session = await auth()
  if (!session || session.user.role !== "teacher") return { error: "権限がありません", approved: 0 }

  if (!ids.length) return { error: "", approved: 0 }

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

  if (!homeworks.length) return { error: "", approved: 0 }

  const now = new Date()
  await db.homework.updateMany({
    where: { id: { in: homeworks.map((h) => h.id) } },
    data: { status: "approved", reviewedAt: now },
  })

  // 差し戻し履歴を一括取得してN+1を回避
  const rejectedEvents = await db.homeworkEvent.findMany({
    where: { homeworkId: { in: homeworks.map((h) => h.id) }, eventType: "rejected" },
    select: { homeworkId: true },
  })
  const rejectedHomeworkIds = new Set(rejectedEvents.map((e) => e.homeworkId))

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
      await plantForHomeworkApproval(homework, rejectedHomeworkIds.has(homework.id))
    })
  )

  revalidatePath("/homework")
  return { error: "", approved: homeworks.length }
}
