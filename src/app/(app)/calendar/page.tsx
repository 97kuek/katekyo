import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getStudentByUserId } from "@/lib/queries"
import CalendarView from "./calendar-view"

export default async function CalendarPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const isTeacher = session.user.role === "teacher"
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0)

  if (isTeacher) {
    const [lessons, homeworks, students, examEvents, subjects] = await Promise.all([
      db.lesson.findMany({
        where: { teacherId: session.user.id, date: { gte: monthStart, lte: monthEnd } },
        include: {
          student: { include: { user: { select: { name: true } } } },
          teacher: { select: { meetLink: true } },
        },
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
      db.examEvent.findMany({
        where: { teacherId: session.user.id, date: { gte: monthStart, lte: monthEnd } },
        include: { student: { include: { user: { select: { name: true } } } } },
        orderBy: { date: "asc" },
      }),
      db.subject.findMany({
        where: { teacherId: session.user.id },
        orderBy: { name: "asc" },
      }),
    ])

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">カレンダー</h1>
        <CalendarView
          lessons={lessons.map((l) => ({ ...l, type: l.type as "online" | "offline", meetLink: l.teacher.meetLink }))}
          deadlines={homeworks.map((h) => ({
            id: h.id,
            title: h.title,
            dueDate: h.dueDate,
            studentName: h.student.user.name,
          }))}
          examEvents={examEvents.map((e) => ({
            id: e.id,
            date: e.date,
            endDate: e.endDate,
            name: e.name,
            testType: e.testType,
            studentName: e.student.user.name,
          }))}
          students={students.map((s) => ({
            id: s.id,
            grade: s.grade,
            user: s.user,
            defaultHourlyRate: s.defaultHourlyRate,
            defaultTravelExpense: s.defaultTravelExpense,
            defaultDurationMin: s.defaultDurationMin,
            defaultSubjectIds: s.defaultSubjectIds,
          }))}
          subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
          isTeacher={true}
        />
      </div>
    )
  }

  const student = await getStudentByUserId(session.user.id)
  if (!student) redirect("/dashboard")

  const [lessons, homeworks, examEvents] = await Promise.all([
    db.lesson.findMany({
      where: { studentId: student.id, date: { gte: monthStart, lte: monthEnd } },
      include: {
        student: { include: { user: { select: { name: true } } } },
        teacher: { select: { meetLink: true } },
      },
      orderBy: { date: "asc" },
    }),
    db.homework.findMany({
      where: { studentId: student.id, status: { in: ["assigned", "rejected"] }, dueDate: { gte: monthStart, lte: monthEnd } },
      include: { student: { include: { user: { select: { name: true } } } } },
      orderBy: { dueDate: "asc" },
    }),
    db.examEvent.findMany({
      where: { studentId: student.id, date: { gte: monthStart, lte: monthEnd } },
      orderBy: { date: "asc" },
    }),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">カレンダー</h1>
      <CalendarView
        lessons={lessons.map((l) => ({ ...l, type: l.type as "online" | "offline", meetLink: l.teacher.meetLink }))}
        deadlines={homeworks.map((h) => ({
          id: h.id,
          title: h.title,
          dueDate: h.dueDate,
          studentName: h.student.user.name,
        }))}
        examEvents={examEvents.map((e) => ({
          id: e.id,
          date: e.date,
          endDate: e.endDate,
          name: e.name,
          testType: e.testType,
        }))}
        students={[]}
        subjects={[]}
        isTeacher={false}
      />
    </div>
  )
}
