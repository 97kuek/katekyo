"use server"

import { db } from "@/lib/db"
import { requireTeacher } from "@/lib/action-guards"
import { revalidatePath } from "next/cache"
import { plantForHomeworkApproval } from "@/lib/garden/actions"
import { sendLineMessage } from "@/lib/line"

export async function bulkApproveHomework(ids: string[]): Promise<{ error: string; approved: number }> {
  const teacher = await requireTeacher()
  if (!teacher) return { error: "権限がありません", approved: 0 }

  if (!ids.length) return { error: "", approved: 0 }

  const homeworks = await db.homework.findMany({
    where: {
      id: { in: ids },
      teacherId: teacher.teacherId,
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
    // コメント無しの承認なので、過去の差し戻しコメントが残らないようクリアする
    data: { status: "approved", reviewedAt: now, teacherFeedback: null, feedbackSeenAt: null },
  })

  // 詳細ページの「やり取り履歴」に承認イベントを残す
  await db.homeworkEvent.createMany({
    data: homeworks.map((h) => ({
      homeworkId: h.id,
      eventType: "approved" as const,
      actorName: teacher.session.user.name ?? "",
      note: null,
    })),
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
