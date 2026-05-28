import { redirect } from "next/navigation"
import { getViewingContext } from "@/lib/view-as"
import { db } from "@/lib/db"
import { getStudentByUserId } from "@/lib/queries"
import CalendarView from "./calendar-view"

export default async function CalendarPage() {
  const ctx = await getViewingContext()
  if (!ctx) redirect("/login")

  const isTeacher = ctx.effectiveRole === "teacher"
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0)

  if (isTeacher) {
    const [lessons, homeworks, students, examEvents, subjects] = await Promise.all([
      db.lesson.findMany({
        where: { teacherId: ctx.effectiveUserId, date: { gte: monthStart, lte: monthEnd } },
        include: {
          student: { include: { user: { select: { name: true } } } },
          teacher: { select: { meetLink: true } },
        },
        orderBy: { date: "asc" },
      }),
      db.homework.findMany({
        where: { teacherId: ctx.effectiveUserId, status: { in: ["assigned", "rejected", "submitted"] }, dueDate: { gte: monthStart, lte: monthEnd } },
        include: { student: { include: { user: { select: { name: true } } } } },
        orderBy: { dueDate: "asc" },
      }),
      db.student.findMany({
        where: { teacherId: ctx.effectiveUserId },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      }),
      db.examEvent.findMany({
        where: { teacherId: ctx.effectiveUserId, date: { gte: monthStart, lte: monthEnd } },
        include: { student: { include: { user: { select: { name: true } } } } },
        orderBy: { date: "asc" },
      }),
      db.subject.findMany({
        where: { teacherId: ctx.effectiveUserId },
        orderBy: { name: "asc" },
      }),
    ])

    return (
      <div className="space-y-4">
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

  const student = await getStudentByUserId(ctx.effectiveUserId)
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
    <div className="space-y-4">
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
