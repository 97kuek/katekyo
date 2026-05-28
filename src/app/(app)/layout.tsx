import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { Suspense } from "react"
import { Toaster } from "sonner"
import Sidebar from "@/components/layout/sidebar"
import Header from "@/components/layout/header"
import BottomNav from "@/components/layout/bottom-nav"
import { SearchParamsToast } from "@/components/success-toast"
import { TermsAgreementModal } from "@/components/terms-agreement-modal"
import { db } from "@/lib/db"
import type { NotificationData } from "@/lib/changelog"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/login")

  const jstNow = new Date(Date.now() + 9 * 60 * 60 * 1000)
  const todayStr = jstNow.toISOString().slice(0, 10)
  const todayStart = new Date(todayStr + "T00:00:00+09:00")
  const todayEnd = new Date(todayStr + "T23:59:59.999+09:00")

  const [user, notificationData] = await Promise.all([
    db.user.findUnique({
      where: { id: session.user.id },
      select: { agreedToTermsAt: true },
    }),
    fetchNotifications(session.user.id, session.user.role, todayStart, todayEnd),
  ])
  const needsAgreement = !user?.agreedToTermsAt

  return (
    <>
      <div className="flex h-screen bg-muted">
        <Sidebar role={session.user.role} />
        <div className="flex flex-col flex-1 min-w-0">
          <Header name={session.user.name ?? ""} notificationData={notificationData} />
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 pb-20 md:pb-6">
            <div className="max-w-7xl mx-auto">
              <Suspense>
                <SearchParamsToast />
              </Suspense>
              {children}
            </div>
          </main>
        </div>
      </div>
      <BottomNav role={session.user.role} />
      <Toaster richColors position="top-center" />
      <TermsAgreementModal show={needsAgreement} />
    </>
  )
}

async function fetchNotifications(
  userId: string,
  role: string,
  todayStart: Date,
  todayEnd: Date
): Promise<NotificationData> {
  if (role === "teacher") {
    const [pendingHomework, lessons] = await Promise.all([
      db.homework.findMany({
        where: { teacherId: userId, status: "submitted" },
        select: {
          id: true,
          title: true,
          student: { select: { user: { select: { name: true } } } },
        },
        orderBy: { submittedAt: "asc" },
      }),
      db.lesson.findMany({
        where: { teacherId: userId, date: { gte: todayStart, lte: todayEnd } },
        select: {
          id: true,
          date: true,
          type: true,
          student: { select: { user: { select: { name: true } } } },
        },
        orderBy: { date: "asc" },
      }),
    ])
    return {
      role: "teacher",
      pendingHomework: pendingHomework.map((h) => ({
        id: h.id,
        title: h.title,
        studentName: h.student.user.name,
      })),
      lessons: lessons.map((l) => ({
        id: l.id,
        date: l.date.toISOString(),
        type: l.type,
        studentName: l.student.user.name,
      })),
    }
  }

  const student = await db.student.findFirst({
    where: { userId },
    select: { id: true },
  })
  if (!student) return { role: "student", homework: [], lessons: [] }

  const [homework, lessons] = await Promise.all([
    db.homework.findMany({
      where: {
        studentId: student.id,
        status: { in: ["assigned", "rejected"] },
        dueDate: { lte: todayEnd },
      },
      select: { id: true, title: true, dueDate: true },
      orderBy: { dueDate: "asc" },
    }),
    db.lesson.findMany({
      where: { studentId: student.id, date: { gte: todayStart, lte: todayEnd } },
      select: { id: true, date: true, type: true },
      orderBy: { date: "asc" },
    }),
  ])
  return {
    role: "student",
    homework: homework.map((h) => ({
      id: h.id,
      title: h.title,
      dueDate: h.dueDate.toISOString(),
      isOverdue: h.dueDate < todayStart,
    })),
    lessons: lessons.map((l) => ({
      id: l.id,
      date: l.date.toISOString(),
      type: l.type,
    })),
  }
}
