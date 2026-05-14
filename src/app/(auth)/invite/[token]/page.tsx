import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import InviteForm from "./invite-form"

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const invite = await db.inviteToken.findUnique({ where: { token } })
  if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
    notFound()
  }

  return <InviteForm token={token} name={invite.name} email={invite.email} />
}
