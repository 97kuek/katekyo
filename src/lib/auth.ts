import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { authConfig } from "@/lib/auth.config"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { z } from "zod"
import {
  GOOGLE_LINK_COOKIE,
  hashIdentityLinkToken,
  isLinkIntentValid,
} from "@/lib/external-auth"
import { normalizeEmailInput } from "@/lib/input-normalization"

const loginSchema = z.object({
  email: z.preprocess(normalizeEmailInput, z.string().email()),
  password: z.string().min(1),
})

export const googleAuthEnabled = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
)

async function getGoogleAccess(providerSubject: string) {
  const identity = await db.authIdentity.findUnique({
    where: {
      provider_providerSubject: { provider: "google", providerSubject },
    },
    include: {
      accesses: {
        include: { user: true },
        orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
      },
    },
  })

  return identity ? { identity, access: identity.accesses[0] } : null
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ account, profile }) {
      if (account?.provider !== "google") return true

      const googleProfile = profile as { email?: string; email_verified?: boolean } | undefined
      if (!account.providerAccountId || googleProfile?.email_verified !== true) {
        return "/login?error=GoogleEmailNotVerified"
      }

      const existing = await getGoogleAccess(account.providerAccountId)
      const cookieStore = await cookies()
      const rawLinkToken = cookieStore.get(GOOGLE_LINK_COOKIE)?.value
      const intent = rawLinkToken
        ? await db.identityLinkIntent.findUnique({
            where: { tokenHash: hashIdentityLinkToken(rawLinkToken) },
          })
        : null

      if (intent && isLinkIntentValid(intent.expiresAt)) {
        await db.$transaction(async (tx) => {
          const identity = await tx.authIdentity.upsert({
            where: {
              provider_providerSubject: {
                provider: "google",
                providerSubject: account.providerAccountId!,
              },
            },
            create: {
              provider: "google",
              providerSubject: account.providerAccountId!,
              emailAtLink: googleProfile?.email,
              emailVerified: true,
              lastLoginAt: new Date(),
            },
            update: {
              emailAtLink: googleProfile?.email,
              emailVerified: true,
              lastLoginAt: new Date(),
            },
            include: { accesses: { select: { id: true } } },
          })

          await tx.identityAccess.upsert({
            where: {
              identityId_userId: { identityId: identity.id, userId: intent.userId },
            },
            create: {
              identityId: identity.id,
              userId: intent.userId,
              kind: "owner",
              isDefault: identity.accesses.length === 0,
            },
            update: {},
          })
          await tx.authAuditLog.create({
            data: { event: "google_linked", userId: intent.userId, identityId: identity.id },
          })
          await tx.identityLinkIntent.delete({ where: { id: intent.id } })
        })
        cookieStore.delete(GOOGLE_LINK_COOKIE)
        return true
      }

      if (rawLinkToken) cookieStore.delete(GOOGLE_LINK_COOKIE)
      if (!existing?.access) return "/login?error=GoogleNotLinked"

      await db.authIdentity.update({
        where: { id: existing.identity.id },
        data: { lastLoginAt: new Date() },
      })
      await db.authAuditLog.create({
        data: {
          event: "google_login_succeeded",
          userId: existing.access.userId,
          identityId: existing.identity.id,
        },
      })
      return true
    },
    async jwt({ token, user, account }) {
      if (account?.provider === "google" && account.providerAccountId) {
        const linked = await getGoogleAccess(account.providerAccountId)
        if (!linked?.access) return token

        token.id = linked.access.user.id
        token.role = linked.access.user.role
        token.name = linked.access.user.name
        token.email = linked.access.user.email
        token.identityId = linked.identity.id
        return token
      }

      if (user) {
        token.id = user.id as string
        token.role = (user as { role: string }).role
      }
      return token
    },
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data
        const user = await db.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } })
        if (!user) return null

        const valid = await bcrypt.compare(password, user.password)
        if (!valid) return null

        return { id: user.id, email: user.email, name: user.name, role: user.role }
      },
    }),
    ...(googleAuthEnabled ? [Google] : []),
  ],
})
