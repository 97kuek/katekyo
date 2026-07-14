import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { markAsPaid, markAsUnpaid, setPaymentDueDate } from "./actions"
import { buttonVariants } from "@/components/ui/button"
import { calcFee } from "@/lib/billing"
import { formatCurrency } from "@/lib/format"

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
  searchParams: Promise<{ year?: string; month?: string }>
}) {
  const session = await auth()
  if (!session) redirect("/login")

  if (session.user.role === "parent") {
    return <ParentBillingPage parentId={session.user.id} searchParams={searchParams} />
  }

  if (session.user.role !== "teacher") redirect("/dashboard")

  const { year: yearStr, month: monthStr } = await searchParams
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
  const hasFeeData = completedLessons.some((l) => l.hourlyRate != null)

  // 月の最終日（デフォルト期限表示用）
  const defaultDueDateStr = new Date(year, month + 1, 0).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })

  return (
    <div className="space-y-6">
      {/* Month navigator */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <a
            href={`/billing?year=${prevYear}&month=${prevMonth}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            ← 前月
          </a>
          <span className="font-semibold text-sm">{year}年 {month + 1}月</span>
          <a
            href={`/billing?year=${nextYear}&month=${nextMonth}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            翌月 →
          </a>
        </div>
        <a
          href={`/api/billing/export?year=${year}&month=${month + 1}`}
          download
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          CSV
        </a>
      </div>

      {unconfirmedCount > 0 && (
        <div className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-sm text-warning-foreground">
            <span className="font-semibold">{unconfirmedCount}件</span>の授業が未完了です。カレンダーで完了にすると請求に反映されます。
          </p>
          <a href="/calendar" className="text-xs text-warning underline hover:text-warning-foreground shrink-0">カレンダーへ</a>
        </div>
      )}

      {completedLessons.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center text-muted-foreground text-sm">
          {lessons.length > 0 ? "完了済みの授業がありません" : "この月の授業記録はありません"}
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs text-muted-foreground">完了授業</p>
              <p className="text-2xl font-bold mt-1">{completedLessons.length}<span className="text-sm font-normal text-muted-foreground ml-1">回</span></p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs text-muted-foreground">合計時間</p>
              <p className="text-2xl font-bold mt-1">
                {Math.floor(totalMinutes / 60)}<span className="text-sm font-normal text-muted-foreground ml-0.5">h</span>
                {totalMinutes % 60 > 0 && <>{totalMinutes % 60}<span className="text-sm font-normal text-muted-foreground ml-0.5">m</span></>}
              </p>
            </div>
            {hasFeeData && (
              <div className="rounded-lg border bg-card p-4 col-span-2 sm:col-span-1">
                <p className="text-xs text-muted-foreground">合計金額（目安）</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(grandTotal)}</p>
              </div>
            )}
          </div>

          {/* Per-student breakdown */}
          {Array.from(studentMap.entries()).map(([sid, { name, lessons: sLessons }]) => {
            const studentTotal = sLessons.reduce((sum, l) => {
              const fee = calcFee(l)
              return fee != null ? sum + fee : sum
            }, 0)
            const studentMin = sLessons.reduce((sum, l) => sum + (l.durationMin ?? 0), 0)
            const hasStudentFee = sLessons.some((l) => l.hourlyRate != null)
            const paymentRecord = paidMap.get(sid)
            const isPaid = paymentRecord?.paidAt != null
            const dueDateInfo = dueDateLabel(paymentRecord?.dueDate ?? null, isPaid)
            const currentDueDateValue = paymentRecord?.dueDate
              ? new Date(paymentRecord.dueDate).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\//g, "-")
              : ""

            return (
              <div key={name} className="rounded-lg border bg-card overflow-hidden">
                <div className="px-4 py-3 border-b bg-muted space-y-2">
                  {/* 1行目: 名前・ステータス / 金額 */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <p className="font-medium text-sm break-words">{name}</p>
                      {isPaid && (
                        <span className="text-xs bg-primary/15 text-primary font-medium rounded-full px-2 py-0.5">入金済み</span>
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
                  {/* 2行目: 期限設定 / 入金確認 */}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <form action={setPaymentDueDate} className="flex w-full min-w-0 items-center gap-2 sm:w-auto">
                      <input type="hidden" name="studentId" value={sid} />
                      <input type="hidden" name="year" value={year} />
                      <input type="hidden" name="month" value={month + 1} />
                      <span className="text-xs text-muted-foreground shrink-0">期限</span>
                      <input
                        type="date"
                        name="dueDate"
                        defaultValue={currentDueDateValue}
                        className="h-11 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-base text-foreground md:h-7 md:w-32 md:flex-none md:px-2 md:text-xs"
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
                    <form action={isPaid ? markAsUnpaid : markAsPaid} className="w-full shrink-0 sm:ml-auto sm:w-auto">
                      <input type="hidden" name="studentId" value={sid} />
                      <input type="hidden" name="year" value={year} />
                      <input type="hidden" name="month" value={month + 1} />
                      <button
                        type="submit"
                        className={
                          buttonVariants({
                            variant: isPaid ? "outline" : "default",
                            size: "xs",
                            className: "h-10 w-full px-3 text-sm md:h-7 md:w-auto md:px-2.5 md:text-xs",
                          }) + (isPaid ? " border-primary/30 text-primary bg-transparent" : "")
                        }
                      >
                        {isPaid ? "✓ 入金済み" : "入金確認"}
                      </button>
                    </form>
                  </div>
                </div>
                <div className="divide-y">
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
                            <p className="text-xs text-warning mt-0.5 line-clamp-1">📝 {l.lessonLog}</p>
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
            )
          })}

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
  searchParams: Promise<{ year?: string; month?: string }>
}) {
  const { year: yearStr, month: monthStr } = await searchParams
  const now = new Date()
  const year = yearStr ? parseInt(yearStr) : now.getFullYear()
  const month = monthStr ? parseInt(monthStr) - 1 : now.getMonth()
  const monthStart = new Date(year, month, 1)
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59)

  const links = await db.parentStudent.findMany({ where: { parentId } })
  if (links.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-12 text-center text-sm text-muted-foreground">
        まだお子様の情報が登録されていません
      </div>
    )
  }

  const studentIds = links.map((l) => l.studentId)
  const [lessons, payments] = await Promise.all([
    db.lesson.findMany({
      where: { studentId: { in: studentIds }, date: { gte: monthStart, lte: monthEnd }, completedAt: { not: null } },
      include: { student: { include: { user: { select: { name: true } } } } },
      orderBy: { date: "asc" },
    }),
    db.monthlyPayment.findMany({
      where: { studentId: { in: studentIds }, year, month: month + 1 },
    }),
  ])

  const paidMap = new Map(payments.map((p) => [p.studentId, p]))

  const prevYear = month === 0 ? year - 1 : year
  const prevMonth = month === 0 ? 12 : month
  const nextYear = month === 11 ? year + 1 : year
  const nextMonth = month === 11 ? 1 : month + 2

  // Group by student
  const studentMap = new Map<string, { name: string; lessons: typeof lessons }>()
  for (const l of lessons) {
    if (!studentMap.has(l.studentId)) {
      studentMap.set(l.studentId, { name: l.student.user.name, lessons: [] })
    }
    studentMap.get(l.studentId)!.lessons.push(l)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <a href={`/billing?year=${prevYear}&month=${prevMonth}`} className={buttonVariants({ variant: "outline", size: "sm" })}>← 前月</a>
        <span className="font-semibold text-sm">{year}年 {month + 1}月</span>
        <a href={`/billing?year=${nextYear}&month=${nextMonth}`} className={buttonVariants({ variant: "outline", size: "sm" })}>翌月 →</a>
      </div>

      {lessons.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center text-muted-foreground text-sm">この月の授業記録はありません</div>
      ) : (
        <div className="space-y-4">
          {Array.from(studentMap.entries()).map(([sid, { name, lessons: sLessons }]) => {
            const paymentRecord = paidMap.get(sid)
            const isPaid = paymentRecord?.paidAt != null
            const studentTotal = sLessons.reduce((sum, l) => {
              const fee = calcFee(l)
              return fee != null ? sum + fee : sum
            }, 0)
            const hasFee = sLessons.some((l) => l.hourlyRate != null)
            const dueDateInfo = dueDateLabel(paymentRecord?.dueDate ?? null, isPaid)
            return (
              <div key={sid} className="rounded-lg border bg-card overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b bg-muted gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">{name}</p>
                    {isPaid && (
                      <span className="text-xs bg-primary/15 text-primary font-medium rounded-full px-2 py-0.5">入金済み</span>
                    )}
                    {dueDateInfo && (
                      <span className={`text-xs ${dueDateInfo.className}`}>{dueDateInfo.text}</span>
                    )}
                  </div>
                  {hasFee && (
                    <span className="text-sm font-semibold">{formatCurrency(studentTotal)}</span>
                  )}
                </div>
                <div className="divide-y">
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
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
