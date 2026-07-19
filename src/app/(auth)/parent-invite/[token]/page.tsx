import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { linkExistingParent } from "./actions"
import ParentInviteForm from "./parent-invite-form"

export default async function ParentInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const invite = await db.parentInviteToken.findUnique({ where: { token } })
  if (!invite || invite.usedAt || invite.expiresAt < new Date()) notFound()

  const session = await auth()

  // ログイン済みの場合
  if (session) {
    if (session.user.role !== "parent") {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">別のアカウントでログイン中です</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              保護者招待リンクを使うには、先に現在のアカウント（{session.user.name}）からログアウトしてください。
            </p>
          </CardContent>
        </Card>
      )
    }

    // 保護者としてログイン済み → 生徒を紐づけて完了
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">お子様の学習情報を追加しますか？</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            現在のアカウント（{session.user.name}）に新しいお子様の情報を追加します。
          </p>
          <form
            action={async () => {
              "use server"
              await linkExistingParent(token)
            }}
          >
            <Button type="submit">
              追加して続ける
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  return <ParentInviteForm token={token} defaultEmail={invite.email ?? undefined} />
}
