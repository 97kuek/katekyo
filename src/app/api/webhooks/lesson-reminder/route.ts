import { verifySignatureAppRouter } from "@upstash/qstash/nextjs"
import { db } from "@/lib/db"
import { sendLineMessage } from "@/lib/line"

export const POST = verifySignatureAppRouter(async (req: Request) => {
  const { lessonId } = await req.json() as { lessonId: string }

  console.log(`[lesson-reminder] processing lessonId=${lessonId}`)

  const lesson = await db.lesson.findFirst({
    where: { id: lessonId, type: "online" },
    include: {
      teacher: { select: { meetLink: true, lineUserId: true } },
      student: { include: { user: { select: { lineUserId: true, name: true } } } },
    },
  })

  if (!lesson || !lesson.teacher.meetLink) {
    return new Response("skipped: no lesson or no meetLink", { status: 200 })
  }

  const meetLink = lesson.teacher.meetLink
  const studentName = lesson.student.user.name

  const sends: Promise<void>[] = []

  const studentLineUserId = lesson.student.user.lineUserId
  if (studentLineUserId) {
    sends.push(sendLineMessage(
      studentLineUserId,
      `📅 もうすぐ授業が始まります\n\n10分後に授業が始まります。\n以下のリンクからGoogle Meetに参加してください。\n\n${meetLink}`
    ))
  }

  const teacherLineUserId = lesson.teacher.lineUserId
  if (teacherLineUserId) {
    sends.push(sendLineMessage(
      teacherLineUserId,
      `📅 まもなく授業があります\n\n${studentName}さんとの授業が10分後に始まります。\n\n${meetLink}`
    ))
  }

  if (sends.length === 0) {
    return new Response("skipped: no LINE users linked", { status: 200 })
  }

  await Promise.all(sends)

  return new Response("ok", { status: 200 })
})
