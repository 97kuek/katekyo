import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { NextResponse } from "next/server"
import { matchesPathSegment } from "@/lib/security-validation"

const { auth } = NextAuth(authConfig)

// 保護者が閲覧できるパスのプレフィックス
const PARENT_ALLOWED = ["/dashboard", "/grades", "/calendar", "/billing", "/settings", "/help", "/parent-invite", "/homework", "/garden"]

// 生徒がアクセス不可のパスのプレフィックス
const STUDENT_BLOCKED = ["/students", "/billing", "/grades/new"]

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { pathname } = req.nextUrl
  const role = req.auth?.user?.role as string | undefined

  const isPublicPath =
    matchesPathSegment(pathname, "/login") ||
    matchesPathSegment(pathname, "/register") ||
    matchesPathSegment(pathname, "/invite") ||
    matchesPathSegment(pathname, "/parent-invite") ||
    matchesPathSegment(pathname, "/terms") ||
    matchesPathSegment(pathname, "/privacy")

  if (!isLoggedIn && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (isLoggedIn && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  if (role === "parent" && isLoggedIn) {
    const allowed = PARENT_ALLOWED.some((p) => matchesPathSegment(pathname, p))
    if (!allowed && !isPublicPath) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
  }

  if (role === "student" && isLoggedIn) {
    const blocked = STUDENT_BLOCKED.some((p) => matchesPathSegment(pathname, p))
    if (blocked) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
  }
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon\\.ico|icon$|icon2$|apple-icon$|manifest\\.webmanifest$).*)"],
}
