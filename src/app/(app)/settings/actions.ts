"use server"

import { auth, googleAuthEnabled, signIn, signOut } from "@/lib/auth"
import { db } from "@/lib/db"
import { requireTeacher } from "@/lib/action-guards"
import { z } from "zod"
import { unlinkRichMenuFromUser } from "@/lib/line"
import { randomBytes } from "node:crypto"
import { cookies } from "next/headers"
import { isAllowedMeetUrl } from "@/lib/security-validation"
import { invalidateUser } from "@/lib/cache-invalidation"
import {
  GOOGLE_LINK_COOKIE,
  GOOGLE_LINK_TTL_MS,
  hashIdentityLinkToken,
} from "@/lib/external-auth"

export async function linkGoogleAccount(): Promise<void> {
  const session = await auth()
  if (!session || !googleAuthEnabled) return

  const token = randomBytes(32).toString("base64url")
  const tokenHash = hashIdentityLinkToken(token)
  const expiresAt = new Date(Date.now() + GOOGLE_LINK_TTL_MS)

  await db.$transaction([
    db.identityLinkIntent.deleteMany({ where: { userId: session.user.id } }),
    db.identityLinkIntent.create({
      data: { userId: session.user.id, tokenHash, expiresAt },
    }),
  ])

  const cookieStore = await cookies()
  cookieStore.set(GOOGLE_LINK_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: GOOGLE_LINK_TTL_MS / 1000,
  })

  await signIn("google", { redirectTo: "/settings?google=linked" })
}

export async function unlinkGoogleAccount(): Promise<void> {
  const session = await auth()
  if (!session) return

  await db.$transaction(async (tx) => {
    const accesses = await tx.identityAccess.findMany({
      where: { userId: session.user.id, identity: { provider: "google" } },
      select: { id: true, identityId: true },
    })
    await tx.identityAccess.deleteMany({
      where: { id: { in: accesses.map((access) => access.id) } },
    })
    for (const access of accesses) {
      await tx.authAuditLog.create({
        data: {
          event: "google_unlinked",
          userId: session.user.id,
          identityId: access.identityId,
        },
      })
      const remaining = await tx.identityAccess.count({
        where: { identityId: access.identityId },
      })
      if (remaining === 0) {
        await tx.authIdentity.delete({ where: { id: access.identityId } })
      }
    }
  })

  await signOut({ redirectTo: "/login?google=unlinked" })
}

export async function generateLinkToken(): Promise<{ error?: string; token?: string }> {
  const session = await auth()
  if (!session) return { error: "認証が必要です" }

  // 48bit。6桁コードより総当たり耐性を大幅に高めつつ、LINEへコピーしやすい形式にする。
  const token = randomBytes(6).toString("hex").toUpperCase()
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

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { lineUserId: true },
  })
  if (user?.lineUserId) {
    await unlinkRichMenuFromUser(user.lineUserId)
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { lineUserId: null },
  })

  invalidateUser(session.user.id)

  return {}
}

const meetLinkSchema = z.object({
  meetLink: z.string().url("有効なURLを入力してください")
    .refine(isAllowedMeetUrl, "Google Meet のURLを入力してください")
    .or(z.literal("")),
})

export async function deleteParentAccount(): Promise<{ error: string }> {
  const session = await auth()
  if (!session || session.user.role !== "parent") return { error: "権限がありません" }

  await db.user.delete({ where: { id: session.user.id } })
  await signOut({ redirectTo: "/login" })
  return { error: "" }
}

export async function saveMeetLink(
  _prevState: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const teacher = await requireTeacher()
  if (!teacher) return { error: "権限がありません" }

  const result = meetLinkSchema.safeParse({ meetLink: formData.get("meetLink") })
  if (!result.success) return { error: result.error.issues[0].message }

  await db.user.update({
    where: { id: teacher.teacherId },
    data: { meetLink: result.data.meetLink || null },
  })

  invalidateUser(teacher.teacherId)

  return { success: true }
}
