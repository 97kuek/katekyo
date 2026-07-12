"use server"

import { db } from "@/lib/db"
import { requireTeacher } from "@/lib/action-guards"
import { revalidatePath } from "next/cache"

export async function revokeInvite(formData: FormData) {
  const teacher = await requireTeacher()
  if (!teacher) return

  const id = formData.get("id") as string
  if (!id) return

  await db.inviteToken.deleteMany({
    where: { id, teacherId: teacher.teacherId },
  })

  revalidatePath("/students/invites")
}
