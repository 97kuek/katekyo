import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import CreateHomeworkForm from "./create-form"

export default async function NewHomeworkPage() {
  const session = await auth()
  if (!session || session.user.role !== "teacher") redirect("/dashboard")

  const students = await db.student.findMany({
    where: { teacherId: session.user.id },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  })

  if (students.length === 0) {
    return (
      <div className="max-w-lg space-y-6">
        <div>
          <Link href="/homework" className="text-sm text-muted-foreground hover:underline">
            ← 宿題一覧に戻る
          </Link>
        </div>
        <div className="rounded-lg border bg-white p-12 text-center">
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
    <div className="max-w-lg space-y-6">
      <div>
        <Link href="/homework" className="text-sm text-muted-foreground hover:underline">
          ← 宿題一覧に戻る
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>宿題を作成する</CardTitle>
          <CardDescription>生徒に新しい宿題を割り当てます</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateHomeworkForm students={students} />
        </CardContent>
      </Card>
    </div>
  )
}
