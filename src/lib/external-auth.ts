import { createHash } from "node:crypto"

export const GOOGLE_LINK_COOKIE = "katekyo_google_link"
export const GOOGLE_LINK_TTL_MS = 10 * 60 * 1000

export function hashIdentityLinkToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export function isLinkIntentValid(expiresAt: Date, now = new Date()) {
  return expiresAt.getTime() > now.getTime()
}
