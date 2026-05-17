import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getStudentByUserId } from "@/lib/queries"
import GardenCanvas from "./garden-canvas"
import { TreePine } from "lucide-react"

export default async function GardenPage() {
  const session = await auth()
  if (!session) redirect("/login")
  if (session.user.role !== "student") redirect("/dashboard")

  const student = await getStudentByUserId(session.user.id)
  if (!student) redirect("/dashboard")

  const items = await db.gardenItem.findMany({
    where: { studentId: student.id },
    select: { x: true, y: true, itemType: true },
  })

  const total = items.length
  const max = 64

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">学習の森</h1>
        <span className="text-sm tabular-nums text-muted-foreground">
          {total} / {max}
        </span>
      </div>

      {total === 0 ? (
        <div className="rounded-xl border bg-white p-12 flex flex-col items-center gap-3 text-center">
          <TreePine className="h-10 w-10 text-green-300" />
          <p className="font-medium text-muted-foreground">まだ何も育っていません</p>
          <p className="text-sm text-muted-foreground">
            宿題が先生に承認されるたびに、<br />森にアイテムが1つ育ちます
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-white p-4 overflow-hidden">
          <GardenCanvas items={items} />
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        宿題が承認されるたびに自動で育ちます
      </p>
    </div>
  )
}
