"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"

export async function agreeToTerms() {
  const session = await auth()
  if (!session) redirect("/login")

  await db.user.update({
    where: { id: session.user.id },
    data: { agreedToTermsAt: new Date() },
  })
}
