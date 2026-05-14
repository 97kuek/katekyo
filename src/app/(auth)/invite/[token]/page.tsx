import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { auth, signOut } from "@/lib/auth"
import InviteForm from "./invite-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              ログアウトして招待を受ける
            </button>
          </form>
        </CardContent>
      </Card>
    )
  }

  const invite = await db.inviteToken.findUnique({ where: { token } })
  if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
    notFound()
  }

  return <InviteForm token={token} name={invite.name} />
}
