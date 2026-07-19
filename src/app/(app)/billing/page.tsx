import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { markAsPaid, markAsUnpaid, setPaymentDueDate } from "./actions"
import { buttonVariants } from "@/components/ui/button"
import { calcFee } from "@/lib/billing"
import { formatCurrency } from "@/lib/format"
import { Check, ChevronLeft, ChevronRight, Download, FileText } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import Link from "next/link"
import { ParentStudentSwitcher } from "@/components/parent-student-switcher"
import { resolveParentStudentId } from "@/lib/parent-student-context"
import { Input } from "@/components/ui/input"

function dueDateLabel(dueDate: Date | null, isPaid: boolean): { text: string; className: string } | null {
  if (!dueDate) return null
  const now = new Date()
  const isOverdue = !isPaid && dueDate < now
  const dateStr = dueDate.toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo", month: "numeric", day: "numeric" })
  return {
    text: `期限: ${dateStr}`,
    className: isOverdue ? "text-destructive font-medium" : "text-muted-foreground",
  }
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string; status?: string; studentId?: string }>
}) {
  const session = await auth()
  if (!session) redirect("/login")

  if (session.user.role === "parent") {
    return <ParentBillingPage parentId={session.user.id} searchParams={searchParams} />
  }

  if (session.user.role !== "teacher") redirect("/dashboard")

  const { year: yearStr, month: monthStr, status } = await searchParams
  const now = new Date()
  const year = yearStr ? parseInt(yearStr) : now.getFullYear()
  const month = monthStr ? parseInt(monthStr) - 1 : now.getMonth()

  const monthStart = new Date(year, month, 1)
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59)

  const [lessons, payments] = await Promise.all([db.lesson.findMany({
    where: {
      teacherId: session.user.id,
      date: { gte: monthStart, lte: monthEnd },
    },
    include: { student: { include: { user: { select: { name: true } } } } },
    orderBy: { date: "asc" },
  }),
  db.monthlyPayment.findMany({
    where: { teacherId: session.user.id, year, month: month + 1 },
  }),
  ])

  const completedLessons = lessons.filter((l) => l.completedAt != null)
  const unconfirmedCount = lessons.filter((l) => l.completedAt == null && l.date < now).length

  // paidAt が null でないレコードを「入金済み」とみなす
  const paidMap = new Map(payments.map((p) => [p.studentId, p]))

  // Group by student (completed only)
  const studentMap = new Map<string, { name: string; lessons: typeof lessons }>()
  for (const l of completedLessons) {
    const sid = l.studentId
    if (!studentMap.has(sid)) {
      studentMap.set(sid, { name: l.student.user.name, lessons: [] })
    }
    studentMap.get(sid)!.lessons.push(l)
  }

  const prevYear = month === 0 ? year - 1 : year
  const prevMonth = month === 0 ? 12 : month
  const nextYear = month === 11 ? year + 1 : year
  const nextMonth = month === 11 ? 1 : month + 2

  const grandTotal = completedLessons.reduce((sum, l) => {
    const fee = calcFee(l)
    return fee != null ? sum + fee : sum
  }, 0)

  const totalMinutes = completedLessons.reduce((sum, l) => sum + (l.durationMin ?? 0), 0)
  const hasFeeData = completedLessons.some((l) => calcFee(l) != null)
  const currentStatus = status === "paid" ? "paid" : "unpaid"
  const studentEntries = Array.from(studentMap.entries())
  const paidCount = studentEntries.filter(([studentId]) => paidMap.get(studentId)?.paidAt != null).length
  const unpaidCount = studentEntries.length - paidCount
  const visibleStudentEntries = studentEntries.filter(([studentId]) => (paidMap.get(studentId)?.paidAt != null) === (currentStatus === "paid"))

  // 月の最終日（デフォルト期限表示用）
  const defaultDueDateStr = new Date(year, month + 1, 0).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })

  return (
    <div className="space-y-5">
      <PageHeader
        title="請求"
        description={`${year}年${month + 1}月の請求と入金状況`}
        secondaryAction={
          <a href={`/api/billing/export?year=${year}&month=${month + 1}`} download className={buttonVariants({ variant: "ghost", size: "sm", className: "hidden sm:inline-flex" })}>
            <Download className="h-4 w-4" aria-hidden />CSV
          </a>
        }
      />
      {/* Month navigator */}
      <div className="flex items-center justify-center gap-2">
          <a
            href={`/billing?year=${prevYear}&month=${prevMonth}`}
            aria-label="前の月"
            className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </a>
          <span className="min-w-28 text-center font-semibold text-sm">{year}年 {month + 1}月</span>
          <a
            href={`/billing?year=${nextYear}&month=${nextMonth}`}
            aria-label="次の月"
            className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </a>
      </div>

      {unconfirmedCount > 0 && (
        <div className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-sm text-warning-foreground">
            <span className="font-semibold">{unconfirmedCount}件</span>の授業が未完了です。予定から完了にすると請求へ反映されます。
          </p>
          <a href="/calendar" className="text-xs text-warning underline hover:text-warning-foreground shrink-0">予定へ</a>
        </div>
      )}

      {completedLessons.length === 0 ? (
        <EmptyState title={lessons.length > 0 ? "完了済みの授業がありません" : "この月の授業記録はありません"} />
      ) : (
        <>
          {/* Summary */}
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">今月の請求合計</p>
            <p className="mt-1 text-2xl font-bold">{hasFeeData ? formatCurrency(grandTotal) : "金額未設定"}</p>
            <p className="mt-2 text-xs text-muted-foreground">完了授業 {completedLessons.length}回 ・ {Math.floor(totalMinutes / 60)}時間{totalMinutes % 60 > 0 ? `${totalMinutes % 60}分` : ""}</p>
          </div>

          <nav aria-label="支払い状態" className="flex rounded-lg border bg-card p-1">
            {[{ value: "unpaid", label: "未入金", count: unpaidCount }, { value: "paid", label: "入金済み", count: paidCount }].map((item) => (
              <Link key={item.value} href={`/billing?year=${year}&month=${month + 1}&status=${item.value}`} aria-current={currentStatus === item.value ? "page" : undefined} className={`flex min-h-10 flex-1 items-center justify-center rounded-md text-sm font-medium ${currentStatus === item.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>{item.label} {item.count}</Link>
            ))}
          </nav>

          {/* Per-student breakdown */}
          {visibleStudentEntries.map(([sid, { name, lessons: sLessons }]) => {
            const studentTotal = sLessons.reduce((sum, l) => {
              const fee = calcFee(l)
              return fee != null ? sum + fee : sum
            }, 0)
            const studentMin = sLessons.reduce((sum, l) => sum + (l.durationMin ?? 0), 0)
            const hasStudentFee = sLessons.some((l) => calcFee(l) != null)
            const paymentRecord = paidMap.get(sid)
            const isPaid = paymentRecord?.paidAt != null
            const dueDateInfo = dueDateLabel(paymentRecord?.dueDate ?? null, isPaid)
            const currentDueDateValue = paymentRecord?.dueDate
              ? new Date(paymentRecord.dueDate).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\//g, "-")
              : ""

            return (
              <div key={sid} className="rounded-lg border bg-card overflow-hidden">
                <div className="px-4 py-3 bg-muted space-y-2">
                  {/* 1行目: 名前・ステータス / 金額 */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <p className="font-medium text-sm break-words">{name}</p>
                      {isPaid && (
                        <span className="rounded-full border border-primary/25 bg-primary/15 px-2 py-0.5 text-xs font-medium text-foreground">入金済み</span>
                      )}
                      {dueDateInfo && (
                        <span className={`text-xs ${dueDateInfo.className}`}>{dueDateInfo.text}</span>
                      )}
                      {!dueDateInfo && !isPaid && (
                        <span className="text-xs text-muted-foreground">期限: {defaultDueDateStr}（月末）</span>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      {hasStudentFee && <p className="font-semibold text-sm">{formatCurrency(studentTotal)}</p>}
                      <p className="text-muted-foreground text-xs">{sLessons.length}回 · {Math.floor(studentMin / 60)}h{studentMin % 60 > 0 ? `${studentMin % 60}m` : ""}</p>
                    </div>
                  </div>
                  {!isPaid && (
                    <form action={markAsPaid} className="flex justify-end">
                      <input type="hidden" name="studentId" value={sid} /><input type="hidden" name="year" value={year} /><input type="hidden" name="month" value={month + 1} />
                      <button type="submit" className={buttonVariants({ size: "sm" })}>入金確認</button>
                    </form>
                  )}
                </div>
                <details className="group border-t">
                  <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 text-sm font-medium text-muted-foreground hover:bg-muted [&::-webkit-details-marker]:hidden">
                    期限・授業内訳を見る <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" aria-hidden />
                  </summary>
                  <div className="space-y-3 border-t p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <form action={setPaymentDueDate} className="flex w-full min-w-0 items-center gap-2 sm:w-auto">
                      <input type="hidden" name="studentId" value={sid} />
                      <input type="hidden" name="year" value={year} />
                      <input type="hidden" name="month" value={month + 1} />
                      <span className="text-xs text-muted-foreground shrink-0">期限</span>
                      <Input
                        type="date"
                        name="dueDate"
                        defaultValue={currentDueDateValue}
                        className="min-w-0 flex-1 md:h-9 md:w-40 md:flex-none md:text-sm"
                      />
                      <button
                        type="submit"
                        className={buttonVariants({
                          variant: "outline",
                          size: "xs",
                          className: "h-10 px-3 text-sm md:h-7 md:px-2.5 md:text-xs",
                        })}
                      >
                        設定
                      </button>
                    </form>
                    {isPaid && <form action={markAsUnpaid} className="w-full shrink-0 sm:ml-auto sm:w-auto">
                      <input type="hidden" name="studentId" value={sid} />
                      <input type="hidden" name="year" value={year} />
                      <input type="hidden" name="month" value={month + 1} />
                      <button
                        type="submit"
                        className={
                          buttonVariants({
                            variant: "outline",
                            size: "xs",
                            className: "h-10 w-full px-3 text-sm md:h-7 md:w-auto md:px-2.5 md:text-xs",
                          }) + " border-primary/30 bg-transparent text-primary"
                        }
                      >
                          <><Check className="h-3.5 w-3.5" aria-hidden />入金済みを解除</>
                      </button>
                    </form>}
                  </div>
                <div className="divide-y rounded-lg border">
                  {sLessons.map((l) => {
                    const fee = calcFee(l)
                    const dateLabel = l.date.toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo", month: "numeric", day: "numeric", weekday: "short" })
                    const timeStr = l.date.toLocaleTimeString("ja-JP", { timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit" })
                    return (
                      <div key={l.id} className="px-4 py-2.5 flex items-start justify-between gap-3 text-sm">
                        <div>
                          <p className="font-medium">
                            {dateLabel} {timeStr}〜
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {l.type === "online" ? "オンライン" : "対面"}
                            {l.durationMin ? ` · ${l.durationMin}分` : ""}
                            {l.hourlyRate ? ` · 時給${formatCurrency(l.hourlyRate)}` : ""}
                            {l.travelExpense != null && l.travelExpense > 0 ? ` · 交通費${formatCurrency(l.travelExpense)}` : ""}
                          </p>
                          {l.lessonLog && (
                            <p className="mt-0.5 flex items-center gap-1 text-xs text-warning-foreground line-clamp-1"><FileText className="h-3 w-3 shrink-0" aria-hidden />{l.lessonLog}</p>
                          )}
                        </div>
                        {fee != null && (
                          <p className="font-medium shrink-0">{formatCurrency(fee)}</p>
                        )}
                      </div>
                    )
                  })}
                </div>
                  </div>
                </details>
              </div>
            )
          })}

          {visibleStudentEntries.length === 0 && <EmptyState title={currentStatus === "paid" ? "入金済みの請求はありません" : "未入金の請求はありません"} />}

          {!hasFeeData && (
            <p className="text-xs text-muted-foreground text-center">
              授業に時給を設定すると金額が自動計算されます。授業追加・編集フォームから設定してください。
            </p>
          )}
        </>
      )}
    </div>
  )
}

async function ParentBillingPage({
  parentId,
  searchParams,
}: {
  parentId: string
  searchParams: Promise<{ year?: string; month?: string; studentId?: string }>
}) {
  const { year: yearStr, month: monthStr, studentId } = await searchParams
  const now = new Date()
  const year = yearStr ? parseInt(yearStr) : now.getFullYear()
  const month = monthStr ? parseInt(monthStr) - 1 : now.getMonth()
  const monthStart = new Date(year, month, 1)
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59)

  const links = await db.parentStudent.findMany({
    where: { parentId },
    include: { student: { include: { user: { select: { name: true } } } } },
  })
  if (links.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-12 text-center text-sm text-muted-foreground">
        まだお子様の情報が登録されていません
      </div>
    )
  }

  const studentIds = links.map((l) => l.studentId)
  const effectiveStudentId = await resolveParentStudentId(studentIds, studentId)
  const [lessons, payments] = await Promise.all([
    db.lesson.findMany({
      where: { studentId: effectiveStudentId, date: { gte: monthStart, lte: monthEnd }, completedAt: { not: null } },
      include: { student: { include: { user: { select: { name: true } } } } },
      orderBy: { date: "asc" },
    }),
    db.monthlyPayment.findMany({
      where: { studentId: effectiveStudentId, year, month: month + 1 },
    }),
  ])

  const paidMap = new Map(payments.map((p) => [p.studentId, p]))

  const prevYear = month === 0 ? year - 1 : year
  const prevMonth = month === 0 ? 12 : month
  const nextYear = month === 11 ? year + 1 : year
  const nextMonth = month === 11 ? 1 : month + 2

  // Group by student
  const selectedLink = links.find((link) => link.studentId === effectiveStudentId)!
  const studentMap = new Map<string, { name: string; lessons: typeof lessons }>([
    [effectiveStudentId, { name: selectedLink.student.user.name, lessons: [] }],
  ])
  for (const l of lessons) {
    if (!studentMap.has(l.studentId)) {
      studentMap.set(l.studentId, { name: l.student.user.name, lessons: [] })
    }
    studentMap.get(l.studentId)!.lessons.push(l)
  }

  return (
    <div className="space-y-5">
      <PageHeader title="請求" description="請求額・期限・入金状況を確認できます。" />
      <ParentStudentSwitcher students={links.map(({ student }) => ({ id: student.id, name: student.user.name }))} selectedStudentId={effectiveStudentId} />
      <div className="flex items-center justify-center gap-2">
        <a aria-label="前の月" href={`/billing?year=${prevYear}&month=${prevMonth}&studentId=${effectiveStudentId}`} className={buttonVariants({ variant: "ghost", size: "icon-sm" })}><ChevronLeft className="h-4 w-4" aria-hidden /></a>
        <span className="min-w-28 text-center font-semibold text-sm">{year}年 {month + 1}月</span>
        <a aria-label="次の月" href={`/billing?year=${nextYear}&month=${nextMonth}&studentId=${effectiveStudentId}`} className={buttonVariants({ variant: "ghost", size: "icon-sm" })}><ChevronRight className="h-4 w-4" aria-hidden /></a>
      </div>

      <div className="space-y-4">
          {Array.from(studentMap.entries()).map(([sid, { name, lessons: sLessons }]) => {
            const paymentRecord = paidMap.get(sid)
            const isPaid = paymentRecord?.paidAt != null
            const studentTotal = sLessons.reduce((sum, l) => {
              const fee = calcFee(l)
              return fee != null ? sum + fee : sum
            }, 0)
            const hasFee = sLessons.some((l) => calcFee(l) != null)
            const dueDateInfo = dueDateLabel(paymentRecord?.dueDate ?? null, isPaid)
            return (
              <div key={sid} className="rounded-lg border bg-card overflow-hidden">
                <div className="space-y-3 bg-muted px-5 py-4">
                  <p className="text-xs text-muted-foreground">{name}・今月の請求</p>
                  <div className="flex items-end justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {isPaid && (
                      <span className="rounded-full border border-primary/25 bg-primary/15 px-2 py-0.5 text-xs font-medium text-foreground">入金済み</span>
                    )}
                    {dueDateInfo && (
                      <span className={`text-xs ${dueDateInfo.className}`}>{dueDateInfo.text}</span>
                    )}
                  </div>
                  {hasFee && (
                    <span className="text-2xl font-bold">{formatCurrency(studentTotal)}</span>
                  )}
                  {!hasFee && <span className="text-sm text-muted-foreground">請求金額は未設定です</span>}
                  </div>
                </div>
                {sLessons.length > 0 ? <details className="group border-t">
                  <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 text-sm font-medium text-muted-foreground hover:bg-muted [&::-webkit-details-marker]:hidden">授業の内訳（{sLessons.length}回）<ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" aria-hidden /></summary>
                  <div className="divide-y border-t">
                  {sLessons.map((l) => {
                    const fee = calcFee(l)
                    const dateLabel = l.date.toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo", month: "numeric", day: "numeric", weekday: "short" })
                    const timeStr = l.date.toLocaleTimeString("ja-JP", { timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit" })
                    return (
                      <div key={l.id} className="px-4 py-2.5 flex items-start justify-between gap-3 text-sm">
                        <div>
                          <p className="font-medium">{dateLabel} {timeStr}〜</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {l.type === "online" ? "オンライン" : "対面"}
                            {l.durationMin ? ` · ${l.durationMin}分` : ""}
                          </p>
                        </div>
                        {fee != null && <p className="font-medium shrink-0">{formatCurrency(fee)}</p>}
                      </div>
                    )
                  })}
                  </div>
                </details> : <p className="border-t px-4 py-5 text-sm text-muted-foreground">この月の完了済み授業はありません。</p>}
              </div>
            )
          })}
        </div>
    </div>
  )
}
