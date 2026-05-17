import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// Vercel Cron calls this daily at 18:00 UTC (03:00 JST).
// Deletes approved homework whose due date passed more than 7 days ago.
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization")
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 7)

  const result = await db.homework.deleteMany({
    where: {
      status: "approved",
      dueDate: { lt: cutoff },
    },
  })

  return NextResponse.json({ deleted: result.count })
}
