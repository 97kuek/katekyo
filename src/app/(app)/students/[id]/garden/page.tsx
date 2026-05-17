import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import GardenCanvas from "@/app/(app)/garden/garden-canvas"
import { TreePine, Trophy } from "lucide-react"
import type { GardenItemType } from "@/lib/garden-utils"

export default async function StudentGardenPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session || session.user.role !== "teacher") redirect("/dashboard")

  const student = await db.student.findFirst({
    where: { id, teacherId: session.user.id },
    include: { user: { select: { name: true } } },
  })
  if (!student) notFound()

  const now = new Date()
  const [rawItems, overdueCount] = await Promise.all([
    db.gardenItem.findMany({
      where: { studentId: id },
      select: { x: true, y: true, itemType: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    db.homework.count({
      where: {
        studentId: id,
        OR: [
          { status: "assigned", dueDate: { lt: now } },
          { status: "rejected" },
        ],
      },
    }),
  ])

  const witheredCount = Math.min(overdueCount, rawItems.length)
  const items = rawItems.map((item, i) => ({
    x: item.x,
    y: item.y,
    itemType: item.itemType as GardenItemType,
    withered: i < witheredCount,
  }))

  const total = items.length
  const max = 64
  const isFull = total >= max
  const generation = student.gardenGeneration

  return (
    <div className="space-y-5 max-w-2xl">
      <Link href="/students" className="text-sm text-muted-foreground hover:underline">
        ← 生徒一覧に戻る
      </Link>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">{student.user.name}の森</h1>
          {generation > 1 && (
            <span className="text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
              第{generation}世代
            </span>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm tabular-nums text-muted-foreground">{total} / {max}</p>
          {witheredCount > 0 && (
            <p className="text-xs text-amber-600 mt-0.5">{witheredCount}個枯れています</p>
          )}
        </div>
      </div>

      {isFull && (
        <div className="rounded-xl border-2 border-amber-400 bg-amber-50 p-4 flex items-center gap-3">
          <Trophy className="h-8 w-8 text-amber-500 shrink-0" />
          <div>
            <p className="font-bold text-amber-800">満開の森 達成</p>
            <p className="text-sm text-amber-600">
              64個がすべて育ちました。次の承認で第{generation + 1}世代の森が始まります。
            </p>
          </div>
        </div>
      )}

      {total === 0 ? (
        <div className="rounded-xl border bg-white p-12 flex flex-col items-center gap-3 text-center">
          <TreePine className="h-10 w-10 text-green-300" />
          <p className="font-medium text-muted-foreground">まだ何も育っていません</p>
          <p className="text-sm text-muted-foreground">
            宿題が承認されるたびにアイテムが1つ育ちます
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-white p-4 overflow-hidden">
          <GardenCanvas items={items} />
        </div>
      )}

      {witheredCount > 0 && (
        <p className="text-xs text-amber-600 text-center">
          期限切れ・差し戻しの宿題が{overdueCount}件あります。提出されると回復します。
        </p>
      )}
    </div>
  )
}
