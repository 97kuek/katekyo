import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// Vercel Cron calls this daily at 18:00 UTC (03:00 JST).
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization")
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()

  // 1. Approved homework whose due date passed 7+ days ago
  const homeworkCutoff = new Date(now)
  homeworkCutoff.setDate(homeworkCutoff.getDate() - 7)

  const homework = await db.homework.deleteMany({
    where: { status: "approved", dueDate: { lt: homeworkCutoff } },
  })

  // 2. Expired invite tokens (unused, expired 7+ days ago)
  const expiredCutoff = new Date(now)
  expiredCutoff.setDate(expiredCutoff.getDate() - 7)

  // 3. Used invite tokens (used 30+ days ago)
  const usedCutoff = new Date(now)
  usedCutoff.setDate(usedCutoff.getDate() - 30)

  const tokens = await db.inviteToken.deleteMany({
    where: {
      OR: [
        { usedAt: null,    expiresAt: { lt: expiredCutoff } },
        { usedAt: { lt: usedCutoff } },
      ],
    },
  })

  return NextResponse.json({
    deletedHomework: homework.count,
    deletedTokens: tokens.count,
  })
}
