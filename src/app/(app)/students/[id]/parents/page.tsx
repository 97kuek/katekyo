import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { UnlinkParentButton } from "./unlink-button"

export default async function StudentParentsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== "teacher") redirect("/dashboard")

  const { id } = await params
  const student = await db.student.findFirst({
    where: { id, teacherId: session.user.id },
    include: { user: { select: { name: true } } },
  })
  if (!student) notFound()

  const parentLinks = await db.parentStudent.findMany({
    where: { studentId: id, teacherId: session.user.id },
    include: { parent: { select: { id: true, name: true, email: true, createdAt: true } } },
    orderBy: { createdAt: "asc" },
  })

  const pendingInvites = await db.parentInviteToken.findMany({
    where: { studentId: id, teacherId: session.user.id, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/students" className="text-sm text-muted-foreground hover:underline">
        ← 生徒一覧に戻る
      </Link>

      <div className="space-y-1">
        <h1 className="text-lg font-semibold">{student.user.name} の保護者管理</h1>
        <p className="text-sm text-muted-foreground">紐づいている保護者アカウントの確認・解除ができます</p>
      </div>

      {/* 登録済み保護者 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">登録済み保護者</p>
          <Link href={`/students/${id}/invite-parent`} className={buttonVariants({ size: "sm", variant: "outline" })}>
            招待リンクを生成
          </Link>
        </div>

        {parentLinks.length === 0 ? (
          <div className="rounded-lg border bg-card p-12 text-center text-sm text-muted-foreground">
            まだ保護者が登録されていません
          </div>
        ) : (
          <div className="rounded-lg border bg-card divide-y">
            {parentLinks.map(({ parent }) => (
              <div key={parent.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{parent.name}</p>
                  <p className="text-xs text-muted-foreground">{parent.email}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    登録日: {parent.createdAt.toLocaleDateString("ja-JP")}
                  </p>
                </div>
                <UnlinkParentButton
                  parentId={parent.id}
                  studentId={id}
                  parentName={parent.name}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 有効期限内の未使用招待 */}
      {pendingInvites.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">招待中（未使用）</p>
          <div className="rounded-lg border bg-card divide-y">
            {pendingInvites.map((inv) => (
              <div key={inv.id} className="px-4 py-3">
                <p className="text-xs text-muted-foreground">
                  有効期限: {inv.expiresAt.toLocaleDateString("ja-JP")}
                  {inv.email && ` · ${inv.email}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
