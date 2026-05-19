"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function generateLinkToken(): Promise<{ error?: string; token?: string }> {
  const session = await auth()
  if (!session) return { error: "認証が必要です" }

  const token = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

  await db.lineLinkToken.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, token, expiresAt },
    update: { token, expiresAt },
  })

  return { token }
}

export async function unlinkLine(): Promise<{ error?: string }> {
  const session = await auth()
  if (!session) return { error: "認証が必要です" }

  await db.user.update({
    where: { id: session.user.id },
    data: { lineUserId: null },
  })

  return {}
}
