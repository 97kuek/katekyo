import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { calcFeeBreakdown } from "@/lib/billing"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const now = new Date()
  const year = parseInt(searchParams.get("year") ?? String(now.getFullYear()))
  const rawMonth = parseInt(searchParams.get("month") ?? String(now.getMonth() + 1))
  const month = rawMonth - 1

  const monthStart = new Date(year, month, 1)
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59)

  const lessons = await db.lesson.findMany({
    where: {
      teacherId: session.user.id,
      date: { gte: monthStart, lte: monthEnd },
      completedAt: { not: null },
    },
    include: { student: { include: { user: { select: { name: true } } } } },
    orderBy: [{ studentId: "asc" }, { date: "asc" }],
  })

  const header = [
    "生徒名",
    "日付",
    "開始時刻",
    "種別",
    "所要時間(分)",
    "時給(円)",
    "交通費(円)",
    "授業料(円)",
    "合計(円)",
  ]

  const rows = lessons.map((l) => {
    const dateStr = l.date.toLocaleDateString("ja-JP", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    const timeStr = l.date.toLocaleTimeString("ja-JP", {
      timeZone: "Asia/Tokyo",
      hour: "2-digit",
      minute: "2-digit",
    })
    const { lessonFee, total } = calcFeeBreakdown(l)
    const hasFee = l.hourlyRate != null || l.travelExpense != null
    return [
      l.student.user.name,
      dateStr,
      timeStr,
      l.type === "online" ? "オンライン" : "対面",
      l.durationMin ?? "",
      l.hourlyRate ?? "",
      l.travelExpense ?? "",
      hasFee ? lessonFee : "",
      hasFee ? total : "",
    ]
  })

  const escape = (v: string | number) =>
    `"${String(v).replace(/"/g, '""')}"`

  const csv = [header, ...rows]
    .map((row) => row.map(escape).join(","))
    .join("\r\n")

  const filename = `billing-${year}-${String(rawMonth).padStart(2, "0")}.csv`

  return new NextResponse("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
