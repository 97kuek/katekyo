import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"

export default async function StudentsPage() {
  const session = await auth()
  if (!session || session.user.role !== "teacher") redirect("/dashboard")

  const students = await db.student.findMany({
    where: { teacherId: session.user.id },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">生徒一覧</h1>
          <p className="text-sm text-muted-foreground mt-1">{students.length}名の生徒が登録されています</p>
        </div>
        <div className="flex gap-2">
          <Link href="/students/invites" className={buttonVariants({ variant: "outline" })}>
            招待管理
          </Link>
          <Link href="/students/invite" className={buttonVariants()}>
            招待リンクを作成
          </Link>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="rounded-lg border bg-white p-12 text-center">
          <p className="text-muted-foreground">まだ生徒が登録されていません</p>
          <Link href="/students/invite" className={buttonVariants({ className: "mt-4 inline-flex" })}>
            最初の生徒を招待する
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">名前</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">メールアドレス</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">学年</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">登録日</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {students.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{s.user.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.user.email}</td>
                  <td className="px-4 py-3">{s.grade}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {s.createdAt.toLocaleDateString("ja-JP")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/students/${s.id}/grades`}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      成績を見る
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
