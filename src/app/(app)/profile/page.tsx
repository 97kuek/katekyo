import { redirect } from "next/navigation"
import { getViewingContext } from "@/lib/view-as"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { NameForm } from "./name-form"
import { PasswordForm } from "./password-form"

export default async function ProfilePage() {
  const ctx = await getViewingContext()
  if (!ctx) redirect("/login")
  const { session } = ctx

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader title="プロフィール" description="名前とログイン情報を変更できます。" />
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">名前</CardTitle>
        </CardHeader>
        <CardContent>
          <NameForm currentName={session.user.name ?? ""} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">パスワード</CardTitle>
        </CardHeader>
        <CardContent>
          <PasswordForm />
        </CardContent>
      </Card>
    </div>
  )
}
