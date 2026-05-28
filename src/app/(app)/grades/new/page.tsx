import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import CreateGradeForm from "./create-form"

export default async function NewGradePage() {
  const session = await auth()
  if (!session || session.user.role !== "teacher") redirect("/dashboard")

  const [students, subjects] = await Promise.all([
    db.student.findMany({
      where: { teacherId: session.user.id },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.subject.findMany({
      where: { teacherId: session.user.id },
      orderBy: { name: "asc" },
    }),
  ])

  if (students.length === 0) {
    return (
      <div className="max-w-2xl space-y-6">
        <Link href="/grades" className="text-sm text-muted-foreground hover:underline">
          ← 成績一覧に戻る
        </Link>
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">生徒が登録されていません</p>
          <p className="text-sm text-muted-foreground mt-1">
            まず
            <Link href="/students/invite" className="underline mx-1">生徒を招待</Link>
            してください
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/grades" className="text-sm text-muted-foreground hover:underline">
        ← 成績一覧に戻る
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>成績を記録する</CardTitle>
          <CardDescription>テスト結果を入力してください（得点・偏差値はすべて任意）</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateGradeForm students={students} subjects={subjects} />
        </CardContent>
      </Card>
    </div>
  )
}
