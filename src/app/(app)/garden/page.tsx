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

  const now = new Date()
  const [rawItems, overdueCount] = await Promise.all([
    db.gardenItem.findMany({
      where: { studentId: student.id },
      select: { x: true, y: true, itemType: true, createdAt: true },
      orderBy: { createdAt: "asc" }, // oldest first → oldest wither first
    }),
    db.homework.count({
      where: {
        studentId: student.id,
        status: { in: ["assigned", "rejected"] },
        dueDate: { lt: now },
      },
    }),
  ])

  const witheredCount = Math.min(overdueCount, rawItems.length)
  const items = rawItems.map((item, i) => ({
    x: item.x,
    y: item.y,
    itemType: item.itemType as "tree" | "bush" | "flower",
    withered: i < witheredCount,
  }))

  const total = items.length
  const max = 64
  const healthyCount = total - witheredCount

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-start justify-between">
        <h1 className="text-2xl font-bold">学習の森</h1>
        <div className="text-right">
          <p className="text-sm tabular-nums text-muted-foreground">{total} / {max}</p>
          {witheredCount > 0 && (
            <p className="text-xs text-amber-600 mt-0.5">
              {witheredCount}個枯れています
            </p>
          )}
        </div>
      </div>

      {total === 0 ? (
        <div className="rounded-xl border bg-white p-12 flex flex-col items-center gap-3 text-center">
          <TreePine className="h-10 w-10 text-green-300" />
          <p className="font-medium text-muted-foreground">まだ何も育っていません</p>
          <p className="text-sm text-muted-foreground">
            宿題が承認されたり高いテスト点数を取ると、<br />森にアイテムが育ちます
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-white p-4 overflow-hidden">
          <GardenCanvas items={items} />
        </div>
      )}

      <div className="text-xs text-muted-foreground text-center space-y-0.5">
        <p>宿題承認・好成績で育ちます</p>
        {witheredCount > 0 ? (
          <p className="text-amber-600">期限切れの宿題があると植物が枯れます。宿題を提出すると回復します。</p>
        ) : (
          <p>期限切れの宿題がないと元気に育ちます</p>
        )}
      </div>
    </div>
  )
}
