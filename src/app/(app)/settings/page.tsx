import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { LineSettings } from "./settings-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { NameForm } from "../profile/name-form"
import { PasswordForm } from "../profile/password-form"

export default async function SettingsPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { lineUserId: true },
  })

  return (
    <div className="max-w-lg space-y-8">
      <h1 className="text-xl font-bold">設定</h1>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">アカウント</h2>
        <p className="text-sm text-muted-foreground -mt-2">{session.user.email}</p>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">名前の変更</CardTitle>
          </CardHeader>
          <CardContent>
            <NameForm currentName={session.user.name ?? ""} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">パスワードの変更</CardTitle>
          </CardHeader>
          <CardContent>
            <PasswordForm />
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">通知</h2>
        <LineSettings isLinked={!!user?.lineUserId} />
      </section>
    </div>
  )
}
