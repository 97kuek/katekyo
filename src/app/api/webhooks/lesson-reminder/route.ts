import { verifySignatureAppRouter } from "@upstash/qstash/nextjs"
import { db } from "@/lib/db"
import { sendLineMessage } from "@/lib/line"

export const POST = verifySignatureAppRouter(async (req: Request) => {
  const { lessonId } = await req.json() as { lessonId: string }

  const lesson = await db.lesson.findFirst({
    where: { id: lessonId, type: "online" },
    include: {
      teacher: { select: { meetLink: true } },
      student: { include: { user: { select: { lineUserId: true } } } },
    },
  })

  if (!lesson || !lesson.teacher.meetLink) {
    return new Response("skipped", { status: 200 })
  }

  const lineUserId = lesson.student.user.lineUserId
  if (!lineUserId) {
    return new Response("no line user", { status: 200 })
  }

  await sendLineMessage(
    lineUserId,
    `📅 もうすぐ授業が始まります\n\n10分後に授業が始まります。\n以下のリンクからGoogle Meetに参加してください。\n\n${lesson.teacher.meetLink}`
  )

  return new Response("ok", { status: 200 })
})
