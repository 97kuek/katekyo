import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { revokeInvite } from "./actions"

export default async function InvitesPage() {
  const session = await auth()
  if (!session || session.user.role !== "teacher") redirect("/dashboard")

  const invites = await db.inviteToken.findMany({
    where: { teacherId: session.user.id },
    orderBy: { createdAt: "desc" },
  })

  const now = new Date()
  const pending = invites.filter((i) => !i.usedAt && i.expiresAt > now)
  const expired = invites.filter((i) => !i.usedAt && i.expiresAt <= now)
  const used = invites.filter((i) => i.usedAt)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/students" className="text-sm text-muted-foreground hover:underline">
            ← 生徒一覧に戻る
          </Link>
          <h1 className="text-2xl font-bold mt-2">招待トークン管理</h1>
        </div>
        <Link href="/students/invite" className={buttonVariants()}>
          新しく招待する
        </Link>
      </div>

      {invites.length === 0 && (
        <div className="rounded-lg border bg-white p-12 text-center">
          <p className="text-muted-foreground">招待トークンがまだありません</p>
        </div>
      )}

      {pending.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-blue-800 bg-blue-50 px-3 py-1.5 rounded-md inline-flex items-center gap-1.5">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-xs">
              {pending.length}
            </span>
            有効（未使用）
          </h2>
          <div className="rounded-lg border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">名前</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">学年</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">有効期限</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">作成日</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pending.map((i) => (
                  <tr key={i.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{i.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{i.grade}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {i.expiresAt.toLocaleDateString("ja-JP")}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {i.createdAt.toLocaleDateString("ja-JP")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <form action={revokeInvite}>
                        <input type="hidden" name="id" value={i.id} />
                        <button
                          type="submit"
                          className="text-xs text-red-600 hover:text-red-800 hover:underline"
                        >
                          取り消す
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {expired.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">期限切れ（未使用）</h2>
          <div className="rounded-lg border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">名前</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">学年</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">有効期限</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {expired.map((i) => (
                  <tr key={i.id} className="hover:bg-gray-50 opacity-60">
                    <td className="px-4 py-3 font-medium">{i.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{i.grade}</td>
                    <td className="px-4 py-3 text-red-500">
                      {i.expiresAt.toLocaleDateString("ja-JP")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <form action={revokeInvite}>
                        <input type="hidden" name="id" value={i.id} />
                        <button
                          type="submit"
                          className="text-xs text-muted-foreground hover:text-red-600 hover:underline"
                        >
                          削除
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {used.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">使用済み</h2>
          <div className="rounded-lg border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">名前</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">学年</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">登録日</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {used.map((i) => (
                  <tr key={i.id} className="hover:bg-gray-50 opacity-60">
                    <td className="px-4 py-3 font-medium">{i.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{i.grade}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {i.usedAt!.toLocaleDateString("ja-JP")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
