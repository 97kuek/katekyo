import { timingSafeEqual } from "node:crypto"

/**
 * Bearer token を秘密値と定数時間で比較する。
 * 秘密値が未設定・空文字の場合は、どのヘッダーも必ず拒否する。
 */
export function hasValidBearerSecret(request: Request, secret: string | undefined): boolean {
  if (!secret) return false

  const authorization = request.headers.get("authorization")
  if (!authorization?.startsWith("Bearer ")) return false

  const provided = authorization.slice("Bearer ".length)
  const expectedBuffer = Buffer.from(secret)
  const providedBuffer = Buffer.from(provided)

  return (
    expectedBuffer.length === providedBuffer.length &&
    timingSafeEqual(expectedBuffer, providedBuffer)
  )
}

export function hasValidCronSecret(request: Request): boolean {
  return hasValidBearerSecret(request, process.env.CRON_SECRET)
}

