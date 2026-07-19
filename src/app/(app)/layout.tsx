import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getViewingContext } from "@/lib/view-as"
import { Suspense } from "react"
import { Toaster } from "sonner"
import Sidebar from "@/components/layout/sidebar"
import Header from "@/components/layout/header"
import BottomNav from "@/components/layout/bottom-nav"
import { SearchParamsToast } from "@/components/notifications/success-toast"
import { TermsAgreementModal } from "@/components/modals/terms-agreement-modal"
import { ViewAsBanner } from "@/components/view-as-banner"
import { PageContent } from "@/components/layout/page-content"
import { PullToRefresh } from "@/components/layout/pull-to-refresh"
import { db } from "@/lib/db"
import { PENDING_STATUSES } from "@/lib/homework-status"
import type { NotificationData } from "@/lib/changelog"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/login")

  const ctx = await getViewingContext()
  const effectiveRole = ctx?.effectiveRole ?? session.user.role
  const effectiveUserId = ctx?.effectiveUserId ?? session.user.id

  const [user, notificationData] = await Promise.all([
    db.user.findUnique({
      where: { id: session.user.id },
      select: { agreedToTermsAt: true },
    }),
    fetchNotifications(effectiveUserId, effectiveRole),
  ])
  const needsAgreement = !user?.agreedToTermsAt

  return (
    <>
      <div className="fixed inset-0 flex flex-col bg-muted overflow-hidden">
        {ctx?.viewingAs && <ViewAsBanner studentName={ctx.viewingAs.studentName} />}
        <div className="flex flex-1 min-h-0">
          <Sidebar role={effectiveRole} />
          <div className="flex flex-col flex-1 min-w-0">
            <Header name={session.user.name ?? ""} notificationData={notificationData} />
            <main className="flex-1 overflow-y-auto overflow-x-hidden overscroll-y-none p-4 md:p-6 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-6">
              <Suspense>
                <SearchParamsToast />
              </Suspense>
              <div className="mx-auto w-full max-w-6xl">
                <PullToRefresh>
                  <PageContent>
                    {children}
                  </PageContent>
                </PullToRefresh>
              </div>
            </main>
          </div>
        </div>
      </div>
      <BottomNav role={effectiveRole} />
      <Toaster richColors position="top-center" />
      <TermsAgreementModal show={needsAgreement} />
    </>
  )
}

async function fetchNotifications(
  userId: string,
  role: string
): Promise<NotificationData> {
  // JST の「今日」の範囲（サーバーが UTC でも日本時間で判定する）
  const jstNow = new Date(Date.now() + 9 * 60 * 60 * 1000)
  const todayStr = jstNow.toISOString().slice(0, 10)
  const todayStart = new Date(todayStr + "T00:00:00+09:00")
  const todayEnd = new Date(todayStr + "T23:59:59.999+09:00")

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

  if (role === "parent") {
    const links = await db.parentStudent.findMany({
      where: { parentId: userId },
      select: { studentId: true },
    })
    const studentIds = links.map((link) => link.studentId)
    if (studentIds.length === 0) return { role: "parent", homework: [], lessons: [] }
    const [homework, lessons] = await Promise.all([
      db.homework.findMany({
        where: { studentId: { in: studentIds }, status: { in: PENDING_STATUSES }, dueDate: { lte: todayEnd } },
        select: { id: true, title: true, dueDate: true, student: { select: { user: { select: { name: true } } } } },
        orderBy: { dueDate: "asc" },
      }),
      db.lesson.findMany({
        where: { studentId: { in: studentIds }, date: { gte: todayStart, lte: todayEnd } },
        select: { id: true, date: true, type: true, student: { select: { user: { select: { name: true } } } } },
        orderBy: { date: "asc" },
      }),
    ])
    return {
      role: "parent",
      homework: homework.map((item) => ({ id: item.id, title: item.title, studentName: item.student.user.name, isOverdue: item.dueDate < todayStart })),
      lessons: lessons.map((lesson) => ({ id: lesson.id, date: lesson.date.toISOString(), type: lesson.type, studentName: lesson.student.user.name })),
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
        status: { in: PENDING_STATUSES },
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
