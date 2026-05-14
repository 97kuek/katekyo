import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import CalendarView from "./calendar-view"

export default async function CalendarPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const isTeacher = session.user.role === "teacher"
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 3, 0)

  if (isTeacher) {
    const [lessons, homeworks, students] = await Promise.all([
      db.lesson.findMany({
        where: { teacherId: session.user.id, date: { gte: monthStart, lte: monthEnd } },
        include: { student: { include: { user: { select: { name: true } } } } },
        orderBy: { date: "asc" },
      }),
      db.homework.findMany({
        where: { teacherId: session.user.id, status: { in: ["assigned", "rejected", "submitted"] }, dueDate: { gte: monthStart, lte: monthEnd } },
        include: { student: { include: { user: { select: { name: true } } } } },
        orderBy: { dueDate: "asc" },
      }),
      db.student.findMany({
        where: { teacherId: session.user.id },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      }),
    ])

    return (
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-2xl font-bold">カレンダー</h1>
        <CalendarView
          lessons={lessons.map((l) => ({ ...l, type: l.type as "online" | "offline", date: l.date }))}
          deadlines={homeworks.map((h) => ({
            id: h.id,
            title: h.title,
            dueDate: h.dueDate,
            studentName: h.student.user.name,
          }))}
          students={students.map((s) => ({ id: s.id, grade: s.grade, user: s.user }))}
          isTeacher={true}
        />
      </div>
    )
  }

  const student = await db.student.findUnique({ where: { userId: session.user.id } })
  if (!student) redirect("/dashboard")

  const [lessons, homeworks] = await Promise.all([
    db.lesson.findMany({
      where: { studentId: student.id, date: { gte: monthStart, lte: monthEnd } },
      include: { student: { include: { user: { select: { name: true } } } } },
      orderBy: { date: "asc" },
    }),
    db.homework.findMany({
      where: { studentId: student.id, status: { in: ["assigned", "rejected"] }, dueDate: { gte: monthStart, lte: monthEnd } },
      include: { student: { include: { user: { select: { name: true } } } } },
      orderBy: { dueDate: "asc" },
    }),
  ])

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">カレンダー</h1>
      <CalendarView
        lessons={lessons.map((l) => ({ ...l, type: l.type as "online" | "offline" }))}
        deadlines={homeworks.map((h) => ({
          id: h.id,
          title: h.title,
          dueDate: h.dueDate,
          studentName: h.student.user.name,
        }))}
        students={[]}
        isTeacher={false}
      />
    </div>
  )
}
