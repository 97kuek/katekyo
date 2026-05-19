import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { LineSettings } from "./settings-client"

export default async function SettingsPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { lineUserId: true },
  })

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-xl font-bold">設定</h1>
      <LineSettings isLinked={!!user?.lineUserId} />
    </div>
  )
}
