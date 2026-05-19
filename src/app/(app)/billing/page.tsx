import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { markAsPaid, markAsUnpaid } from "./actions"

function pad(n: number) { return String(n).padStart(2, "0") }

function calcFee(durationMin: number | null, hourlyRate: number | null, travelExpense: number | null): number | null {
  if (!hourlyRate && !travelExpense) return null
  const lessonFee = durationMin && hourlyRate ? Math.round((durationMin / 60) * hourlyRate) : 0
  return lessonFee + (travelExpense ?? 0)
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>
}) {
  const session = await auth()
  if (!session || session.user.role !== "teacher") redirect("/dashboard")

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

  const paidStudentIds = new Set(payments.map((p) => p.studentId))

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
    const fee = calcFee(l.durationMin, l.hourlyRate, l.travelExpense)
    return fee != null ? sum + fee : sum
  }, 0)

  const totalMinutes = completedLessons.reduce((sum, l) => sum + (l.durationMin ?? 0), 0)
  const hasFeeData = completedLessons.some((l) => l.hourlyRate != null)

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">請求管理</h1>

      {/* Month navigator */}
      <div className="flex items-center gap-3">
        <a
          href={`/billing?year=${prevYear}&month=${prevMonth}`}
          className="px-3 py-1.5 rounded-md border text-sm hover:bg-gray-50 transition-colors"
        >
          ← 前月
        </a>
        <span className="font-semibold text-sm">{year}年 {month + 1}月</span>
        <a
          href={`/billing?year=${nextYear}&month=${nextMonth}`}
          className="px-3 py-1.5 rounded-md border text-sm hover:bg-gray-50 transition-colors"
        >
          翌月 →
        </a>
      </div>

      {unconfirmedCount > 0 && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-sm text-orange-800">
            <span className="font-semibold">{unconfirmedCount}件</span>の授業が未完了です。カレンダーで完了にすると請求に反映されます。
          </p>
          <a href="/calendar" className="text-xs text-orange-700 underline hover:text-orange-900 shrink-0">カレンダーへ</a>
        </div>
      )}

      {completedLessons.length === 0 ? (
        <div className="rounded-lg border bg-white p-12 text-center text-muted-foreground text-sm">
          {lessons.length > 0 ? "完了済みの授業がありません" : "この月の授業記録はありません"}
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border bg-white p-4">
              <p className="text-xs text-muted-foreground">完了授業</p>
              <p className="text-2xl font-bold mt-1">{completedLessons.length}<span className="text-sm font-normal text-muted-foreground ml-1">回</span></p>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <p className="text-xs text-muted-foreground">合計時間</p>
              <p className="text-2xl font-bold mt-1">
                {Math.floor(totalMinutes / 60)}<span className="text-sm font-normal text-muted-foreground ml-0.5">h</span>
                {totalMinutes % 60 > 0 && <>{totalMinutes % 60}<span className="text-sm font-normal text-muted-foreground ml-0.5">m</span></>}
              </p>
            </div>
            {hasFeeData && (
              <div className="rounded-lg border bg-white p-4 col-span-2 sm:col-span-1">
                <p className="text-xs text-muted-foreground">合計金額（目安）</p>
                <p className="text-2xl font-bold mt-1">¥{grandTotal.toLocaleString()}</p>
              </div>
            )}
          </div>

          {/* Per-student breakdown */}
          {Array.from(studentMap.entries()).map(([sid, { name, lessons: sLessons }]) => {
            const studentTotal = sLessons.reduce((sum, l) => {
              const fee = calcFee(l.durationMin, l.hourlyRate, l.travelExpense)
              return fee != null ? sum + fee : sum
            }, 0)
            const studentMin = sLessons.reduce((sum, l) => sum + (l.durationMin ?? 0), 0)
            const hasStudentFee = sLessons.some((l) => l.hourlyRate != null)
            const isPaid = paidStudentIds.has(sid)

            return (
              <div key={name} className="rounded-lg border bg-white overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b bg-gray-50">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{name}</p>
                    {isPaid && (
                      <span className="text-xs bg-green-100 text-green-700 font-medium rounded-full px-2 py-0.5">入金済み</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-right">
                    <span className="text-muted-foreground">{sLessons.length}回 · {Math.floor(studentMin / 60)}h{studentMin % 60 > 0 ? `${studentMin % 60}m` : ""}</span>
                    {hasStudentFee && <span className="font-semibold">¥{studentTotal.toLocaleString()}</span>}
                    <form action={isPaid ? markAsUnpaid : markAsPaid}>
                      <input type="hidden" name="studentId" value={sid} />
                      <input type="hidden" name="year" value={year} />
                      <input type="hidden" name="month" value={month + 1} />
                      <button
                        type="submit"
                        className={`text-xs rounded px-2 py-1 border transition-colors ${isPaid ? "border-green-300 text-green-700 hover:bg-green-50" : "border-gray-300 text-gray-500 hover:bg-gray-50"}`}
                      >
                        {isPaid ? "✓ 入金済み" : "入金確認"}
                      </button>
                    </form>
                  </div>
                </div>
                <div className="divide-y">
                  {sLessons.map((l) => {
                    const fee = calcFee(l.durationMin, l.hourlyRate, l.travelExpense)
                    const timeStr = l.date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })
                    return (
                      <div key={l.id} className="px-5 py-3 flex items-start justify-between gap-3 text-sm">
                        <div>
                          <p className="font-medium">
                            {l.date.getMonth() + 1}/{l.date.getDate()}（{["日","月","火","水","木","金","土"][l.date.getDay()]}）{timeStr}〜
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {l.type === "online" ? "オンライン" : "対面"}
                            {l.durationMin ? ` · ${l.durationMin}分` : ""}
                            {l.hourlyRate ? ` · 時給¥${l.hourlyRate.toLocaleString()}` : ""}
                            {l.travelExpense != null && l.travelExpense > 0 ? ` · 交通費¥${l.travelExpense.toLocaleString()}` : ""}
                          </p>
                          {l.lessonLog && (
                            <p className="text-xs text-amber-700 mt-0.5 line-clamp-1">📝 {l.lessonLog}</p>
                          )}
                        </div>
                        {fee != null && (
                          <p className="font-medium shrink-0">¥{fee.toLocaleString()}</p>
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
