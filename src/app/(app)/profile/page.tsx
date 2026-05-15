import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { NameForm } from "./name-form"
import { PasswordForm } from "./password-form"

export default async function ProfilePage() {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold">プロフィール</h1>
        <p className="text-sm text-muted-foreground mt-1">{session.user.email}</p>
      </div>

      <div className="rounded-lg border bg-white p-5 space-y-4">
        <h2 className="text-sm font-semibold">名前の変更</h2>
        <NameForm currentName={session.user.name ?? ""} />
      </div>

      <div className="rounded-lg border bg-white p-5 space-y-4">
        <h2 className="text-sm font-semibold">パスワードの変更</h2>
        <PasswordForm />
      </div>
    </div>
  )
}
