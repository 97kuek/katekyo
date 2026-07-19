import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { notFound, redirect } from "next/navigation"

export default async function StudentGradesRedirect({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== "teacher") redirect("/dashboard")

  const { id } = await params
  const student = await db.student.findFirst({
    where: { id, teacherId: session.user.id },
    select: { id: true },
  })
  if (!student) notFound()

  redirect(`/grades?studentId=${student.id}`)
}
