"use server"

import { db } from "@/lib/db"
import { requireTeacher } from "@/lib/action-guards"
import { after } from "next/server"
import { plantForHomeworkApproval } from "@/lib/garden/actions"
import { sendLineMessage } from "@/lib/line"
import { invalidateHomework } from "@/lib/cache-invalidation"

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
      student: { include: { user: { select: { id: true, lineUserId: true } } } },
    },
  })

  if (!homeworks.length) return { error: "", approved: 0 }

  const now = new Date()
  const studentIds = Array.from(new Set(homeworks.map((h) => h.studentId)))
  const priorApprovedCounts = await db.homework.groupBy({
    by: ["studentId"],
    where: { teacherId: teacher.teacherId, studentId: { in: studentIds }, status: "approved" },
    _count: { _all: true },
  })
  const approvedCountByStudent = new Map(
    priorApprovedCounts.map((row) => [row.studentId, row._count._all])
  )

  const approvedHomeworks: typeof homeworks = []
  for (const homework of homeworks) {
    const updated = await db.homework.updateMany({
      where: { id: homework.id, teacherId: teacher.teacherId, status: "submitted" },
      // コメント無しの承認なので、過去の差し戻しコメントが残らないようクリアする
      data: { status: "approved", reviewedAt: now, teacherFeedback: null, feedbackSeenAt: null },
    })
    if (updated.count === 1) approvedHomeworks.push(homework)
  }

  if (!approvedHomeworks.length) return { error: "", approved: 0 }

  // 詳細ページの「やり取り履歴」に承認イベントを残す
  await db.homeworkEvent.createMany({
    data: approvedHomeworks.map((h) => ({
      homeworkId: h.id,
      eventType: "approved" as const,
      actorName: teacher.session.user.name ?? "",
      note: null,
    })),
  })

  // 差し戻し履歴を一括取得してN+1を回避
  const rejectedEvents = await db.homeworkEvent.findMany({
    where: { homeworkId: { in: approvedHomeworks.map((h) => h.id) }, eventType: "rejected" },
    select: { homeworkId: true },
  })
  const rejectedHomeworkIds = new Set(rejectedEvents.map((e) => e.homeworkId))

  const baseUrl = process.env.NEXTAUTH_URL ?? ""

  for (const homework of approvedHomeworks.sort((a, b) => {
    const aTime = a.submittedAt?.getTime() ?? a.createdAt.getTime()
    const bTime = b.submittedAt?.getTime() ?? b.createdAt.getTime()
    return a.studentId.localeCompare(b.studentId) || aTime - bTime || a.id.localeCompare(b.id)
  })) {
    const nextApprovedCount = (approvedCountByStudent.get(homework.studentId) ?? 0) + 1
    approvedCountByStudent.set(homework.studentId, nextApprovedCount)

    await plantForHomeworkApproval(homework, rejectedHomeworkIds.has(homework.id), nextApprovedCount)

    invalidateHomework({
      teacherId: teacher.teacherId,
      studentId: homework.studentId,
      homeworkId: homework.id,
      studentUserId: homework.student.user.id,
    })
  }

  const lineMessages = approvedHomeworks.flatMap((homework) => {
    const lineUserId = homework.student.user.lineUserId
    return lineUserId
      ? [{
          lineUserId,
          message: `宿題が承認されました\n\n「${homework.title}」が承認されました。\n森に植物が1つ育ちました。\n${baseUrl}/homework/${homework.id}`,
        }]
      : []
  })
  if (lineMessages.length) {
    after(async () => {
      const results = await Promise.allSettled(
        lineMessages.map(({ lineUserId, message }) => sendLineMessage(lineUserId, message))
      )
      if (results.some((result) => result.status === "rejected")) {
        console.error("[bulkApproveHomework] Some LINE notifications failed")
      }
    })
  }

  return { error: "", approved: approvedHomeworks.length }
}
