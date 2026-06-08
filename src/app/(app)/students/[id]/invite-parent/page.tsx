import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import InviteParentForm from "./invite-parent-form"

export default async function InviteParentPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== "teacher") redirect("/dashboard")

  const { id } = await params
  const student = await db.student.findFirst({
    where: { id, teacherId: session.user.id },
    include: { user: { select: { name: true } } },
  })
  if (!student) notFound()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/students" className="text-sm text-muted-foreground hover:underline">
        ← 生徒一覧に戻る
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>保護者を招待する</CardTitle>
          <CardDescription>
            {student.user.name} の保護者に招待リンクを送付してください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InviteParentForm studentId={id} />
        </CardContent>
      </Card>
    </div>
  )
}
