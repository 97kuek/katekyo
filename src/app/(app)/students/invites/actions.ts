"use server"

import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function revokeInvite(formData: FormData) {
  const session = await auth()
  if (!session || session.user.role !== "teacher") return

  const id = formData.get("id") as string
  if (!id) return

  await db.inviteToken.deleteMany({
    where: { id, teacherId: session.user.id },
  })

  revalidatePath("/students/invites")
}
