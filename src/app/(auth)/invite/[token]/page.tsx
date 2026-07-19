import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { auth, signOut } from "@/lib/auth"
import InviteForm from "./invite-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const session = await auth()
  if (session) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">ログイン中です</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            招待リンクを使うには、先に現在のアカウント（{session.user.name}）からログアウトしてください。
          </p>
          <form
            action={async () => {
              "use server"
              await signOut({ redirectTo: `/invite/${token}` })
            }}
          >
            <Button type="submit">
              ログアウトして招待を受ける
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  const invite = await db.inviteToken.findUnique({ where: { token } })
  if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
    notFound()
  }

  return <InviteForm token={token} name={invite.name} grade={invite.grade} />
}
