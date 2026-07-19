import { redirect } from "next/navigation"
import { getViewingContext } from "@/lib/view-as"
import { db } from "@/lib/db"
import { getStudentByUserId } from "@/lib/queries"
import { PENDING_STATUSES } from "@/lib/homework-status"
import CalendarView from "./calendar-view"
import Link from "next/link"
import { PageHeader } from "@/components/ui/page-header"
import { ParentStudentSwitcher } from "@/components/parent-student-switcher"
import { resolveParentStudentId } from "@/lib/parent-student-context"

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ year?: string; month?: string; studentId?: string }> }) {
  const ctx = await getViewingContext()
  if (!ctx) redirect("/login")

  const isTeacher = ctx.effectiveRole === "teacher"
  const now = new Date()
  const params = await searchParams
  const parsedYear = Number(params.year)
  const parsedMonth = Number(params.month)
  const year = Number.isInteger(parsedYear) && parsedYear >= 2000 && parsedYear <= 2100 ? parsedYear : now.getFullYear()
  const month = Number.isInteger(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12 ? parsedMonth - 1 : now.getMonth()
  const monthStart = new Date(year, month - 1, 1)
  const monthEnd = new Date(year, month + 2, 0, 23, 59, 59)

  if (isTeacher) {
    const students = await db.student.findMany({
      where: { teacherId: ctx.effectiveUserId },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    })
    const selectedStudentId = params.studentId && students.some((student) => student.id === params.studentId) ? params.studentId : undefined
    const [lessons, homeworks, examEvents, subjects] = await Promise.all([
      db.lesson.findMany({
        where: { teacherId: ctx.effectiveUserId, ...(selectedStudentId ? { studentId: selectedStudentId } : {}), date: { gte: monthStart, lte: monthEnd } },
        include: {
          student: { include: { user: { select: { name: true } } } },
          teacher: { select: { meetLink: true } },
        },
        orderBy: { date: "asc" },
      }),
      db.homework.findMany({
        where: { teacherId: ctx.effectiveUserId, ...(selectedStudentId ? { studentId: selectedStudentId } : {}), status: { in: ["assigned", "rejected", "submitted"] }, dueDate: { gte: monthStart, lte: monthEnd } },
        include: { student: { include: { user: { select: { name: true } } } } },
        orderBy: { dueDate: "asc" },
      }),
      db.examEvent.findMany({
        where: { teacherId: ctx.effectiveUserId, ...(selectedStudentId ? { studentId: selectedStudentId } : {}), date: { gte: monthStart, lte: monthEnd } },
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
        <PageHeader title="予定" description="授業・宿題期限・テストをまとめて確認できます。" />
        {selectedStudentId && (
          <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-2 text-sm">
            <span>{students.find((student) => student.id === selectedStudentId)?.user.name}の予定</span>
            <Link href={`/calendar?year=${year}&month=${month + 1}`} className="text-primary hover:underline">すべての生徒</Link>
          </div>
        )}
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
          students={students.filter((s) => !selectedStudentId || s.id === selectedStudentId).map((s) => ({
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
          initialYear={year}
          initialMonth={month}
        />
      </div>
    )
  }

  if (ctx.effectiveRole === "parent") {
    const links = await db.parentStudent.findMany({
      where: { parentId: ctx.effectiveUserId },
      include: { student: { include: { user: { select: { name: true } } } } },
    })
    if (links.length === 0) redirect("/dashboard")

    const allowedStudentIds = links.map((l) => l.studentId)
    const effectiveStudentId = await resolveParentStudentId(allowedStudentIds, params.studentId)
    const [lessons, homeworks, examEvents] = await Promise.all([
      db.lesson.findMany({
        where: { studentId: effectiveStudentId, date: { gte: monthStart, lte: monthEnd } },
        include: {
          student: { include: { user: { select: { name: true } } } },
          teacher: { select: { meetLink: true } },
        },
        orderBy: { date: "asc" },
      }),
      db.homework.findMany({
        where: { studentId: effectiveStudentId, status: { in: PENDING_STATUSES }, dueDate: { gte: monthStart, lte: monthEnd } },
        include: { student: { include: { user: { select: { name: true } } } } },
        orderBy: { dueDate: "asc" },
      }),
      db.examEvent.findMany({
        where: { studentId: effectiveStudentId, date: { gte: monthStart, lte: monthEnd } },
        include: { student: { include: { user: { select: { name: true } } } } },
        orderBy: { date: "asc" },
      }),
    ])

    return (
      <div className="space-y-4">
        <PageHeader title="予定" description="お子さまの授業・期限・テストを確認できます。" />
        <ParentStudentSwitcher students={links.map(({ student }) => ({ id: student.id, name: student.user.name }))} selectedStudentId={effectiveStudentId} />
        <CalendarView
          lessons={lessons.map((l) => ({ ...l, type: l.type as "online" | "offline", meetLink: l.teacher.meetLink }))}
          deadlines={homeworks.map((h) => ({ id: h.id, title: h.title, dueDate: h.dueDate, studentName: h.student.user.name }))}
          examEvents={examEvents.map((e) => ({
            id: e.id, date: e.date, endDate: e.endDate, name: e.name, testType: e.testType,
            studentName: (e as { student?: { user: { name: string } } }).student?.user.name,
          }))}
          students={[]}
          subjects={[]}
          isTeacher={false}
          showStudentNames={true}
          initialYear={year}
          initialMonth={month}
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
      where: { studentId: student.id, status: { in: PENDING_STATUSES }, dueDate: { gte: monthStart, lte: monthEnd } },
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
      <PageHeader title="予定" description="次の授業や宿題期限を確認できます。" />
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
        initialYear={year}
        initialMonth={month}
      />
    </div>
  )
}
