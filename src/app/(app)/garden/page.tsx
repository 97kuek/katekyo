import { redirect } from "next/navigation"
import { getViewingContext } from "@/lib/view-as"
import { db } from "@/lib/db"
import { getStudentByUserId } from "@/lib/queries"
import GardenCanvas from "./garden-canvas"
import { TreePine, Trophy, Star } from "lucide-react"
import type { GardenItemType } from "@/lib/garden/utils"

export default async function GardenPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>
}) {
  const ctx = await getViewingContext()
  if (!ctx) redirect("/login")

  if (ctx.effectiveRole === "parent") {
    const { studentId } = await searchParams
    return <ParentGardenPage parentId={ctx.effectiveUserId} studentIdParam={studentId} />
  }

  if (ctx.effectiveRole !== "student") redirect("/dashboard")

  const student = await getStudentByUserId(ctx.effectiveUserId)
  if (!student) redirect("/dashboard")

  const now = new Date()
  const [rawItems, overdueCount] = await Promise.all([
    db.gardenItem.findMany({
      where: { studentId: student.id },
      select: { x: true, y: true, itemType: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    db.homework.count({
      where: {
        studentId: student.id,
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
  const milestone = [10, 25, 50].includes(total) ? total : undefined
  const generation = student.gardenGeneration

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {generation > 1 && (
            <span className="text-xs font-medium text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
              第{generation}世代
            </span>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm tabular-nums text-muted-foreground">{total} / {max}</p>
          {witheredCount > 0 && (
            <p className="text-xs text-warning mt-0.5">
              {witheredCount}個枯れています
            </p>
          )}
        </div>
      </div>

      {isFull && (
        <div className="rounded-lg border-2 border-warning/60 bg-warning/10 p-4 flex items-center gap-3">
          <Trophy className="h-8 w-8 text-warning shrink-0" />
          <div>
            <p className="font-bold text-warning-foreground">満開の森 達成</p>
            <p className="text-sm text-warning">
              64個がすべて育ちました。次の承認で第{generation + 1}世代の森が始まります。
            </p>
          </div>
        </div>
      )}
      {milestone && !isFull && (
        <div className="rounded-lg border-2 border-warning/60 bg-warning/10 p-4 flex items-center gap-3">
          <Star className="h-7 w-7 text-warning shrink-0 fill-warning/60" />
          <div>
            <p className="font-bold text-warning-foreground">{milestone}個達成おめでとう！</p>
            <p className="text-sm text-warning">
              {milestone === 10 && "コツコツ続けた成果です。この調子で頑張ろう！"}
              {milestone === 25 && "森が大きく育ってきました。素晴らしい努力です！"}
              {milestone === 50 && "50個！もう森の半分が育ちました。ゴールまであと少し！"}
            </p>
          </div>
        </div>
      )}

      {total === 0 ? (
        <div className="rounded-lg border bg-card p-12 flex flex-col items-center gap-3 text-center">
          <TreePine className="h-10 w-10 text-primary/30" />
          <p className="font-medium text-muted-foreground">まだ何も育っていません</p>
          <p className="text-sm text-muted-foreground">
            宿題が承認されたり高いテスト点数を取ると、<br />森にアイテムが育ちます
          </p>
        </div>
      ) : (
        <div className="rounded-lg border bg-card p-4 overflow-hidden">
          <GardenCanvas items={items} milestone={milestone} />
        </div>
      )}

      <div className="rounded-lg border bg-card p-4 space-y-4 text-sm">
        <p className="font-medium">学習の森とは？</p>
        <p className="text-muted-foreground text-xs leading-relaxed">
          勉強の頑張りが森として育っていきます。宿題を提出して承認されたり、テストで好成績を取ると植物が1つ増えます。最大64個まで育てられます。
        </p>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">植物の種類</p>
          <div className="grid grid-cols-1 gap-1.5 text-xs">
            <div className="flex items-start gap-2">
              <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-garden-bamboo mt-1.5" />
              <span><span className="font-medium">竹</span>　— テストで満点 / 偏差値70以上の超レア植物</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-garden-sakura mt-1.5" />
              <span><span className="font-medium">桜</span>　— テストで90%以上 / 偏差値65以上のレア植物</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-garden-bigtree mt-1.5" />
              <span><span className="font-medium">大木</span>　— 宿題が累計5・10・15件と承認されるごとに育つ記念植物</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-garden-tree mt-1.5" />
              <span><span className="font-medium">木</span>　— テストで80〜89% / 偏差値60〜64のときに育つ</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-garden-bush mt-1.5" />
              <span><span className="font-medium">茂み</span>　— テストで60〜79% / 偏差値50〜59のときに育つ</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-warning/60 mt-1.5" />
              <span><span className="font-medium">花</span>　— 宿題承認時 / テストで60%未満のときに育つ</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-garden-mushroom mt-1.5" />
              <span><span className="font-medium">きのこ</span>　— 宿題承認時に約5%の確率でまれに育つ不思議な植物</span>
            </div>
          </div>
        </div>

        <div className="space-y-1.5 text-xs text-muted-foreground border-t pt-3">
          {witheredCount > 0 ? (
            <p className="text-warning font-medium">
              期限切れ・差し戻しの宿題が{overdueCount}件あり、古い植物が{witheredCount}個枯れています。提出すると回復します。
            </p>
          ) : (
            <p>期限切れや差し戻しの宿題があると古い植物が枯れます。提出すれば回復します。</p>
          )}
        </div>
      </div>
    </div>
  )
}

async function ParentGardenPage({
  parentId,
  studentIdParam,
}: {
  parentId: string
  studentIdParam?: string
}) {
  const links = await db.parentStudent.findMany({
    where: { parentId },
    include: { student: { include: { user: { select: { name: true } } } } },
  })
  if (links.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-12 text-center text-sm text-muted-foreground">
        まだお子様の情報が登録されていません
      </div>
    )
  }

  const allowedStudentIds = links.map((l) => l.studentId)
  const effectiveStudentId =
    studentIdParam && allowedStudentIds.includes(studentIdParam)
      ? studentIdParam
      : allowedStudentIds[0]

  const student = links.find((l) => l.studentId === effectiveStudentId)!.student

  const now = new Date()
  const [rawItems, overdueCount] = await Promise.all([
    db.gardenItem.findMany({
      where: { studentId: effectiveStudentId },
      select: { x: true, y: true, itemType: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    db.homework.count({
      where: {
        studentId: effectiveStudentId,
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
  const milestone = [10, 25, 50].includes(total) ? total : undefined
  const generation = student.gardenGeneration

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {links.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          {links.map(({ student: s }) => (
            <a
              key={s.id}
              href={`/garden?studentId=${s.id}`}
              className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                s.id === effectiveStudentId
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:bg-muted"
              }`}
            >
              {s.user.name}
            </a>
          ))}
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {generation > 1 && (
            <span className="text-xs font-medium text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
              第{generation}世代
            </span>
          )}
          <span className="text-sm text-muted-foreground">{student.user.name}の森</span>
        </div>
        <div className="text-right">
          <p className="text-sm tabular-nums text-muted-foreground">{total} / {max}</p>
          {witheredCount > 0 && (
            <p className="text-xs text-warning mt-0.5">{witheredCount}個枯れています</p>
          )}
        </div>
      </div>

      {isFull && (
        <div className="rounded-lg border-2 border-warning/60 bg-warning/10 p-4 flex items-center gap-3">
          <Trophy className="h-8 w-8 text-warning shrink-0" />
          <div>
            <p className="font-bold text-warning-foreground">満開の森 達成</p>
            <p className="text-sm text-warning">
              64個がすべて育ちました。次の承認で第{generation + 1}世代の森が始まります。
            </p>
          </div>
        </div>
      )}
      {milestone && !isFull && (
        <div className="rounded-lg border-2 border-warning/60 bg-warning/10 p-4 flex items-center gap-3">
          <Star className="h-7 w-7 text-warning shrink-0 fill-warning/60" />
          <div>
            <p className="font-bold text-warning-foreground">{milestone}個達成！</p>
            <p className="text-sm text-warning">
              {milestone === 10 && "コツコツ続けた成果です。この調子で頑張ろう！"}
              {milestone === 25 && "森が大きく育ってきました。素晴らしい努力です！"}
              {milestone === 50 && "50個！もう森の半分が育ちました。ゴールまであと少し！"}
            </p>
          </div>
        </div>
      )}

      {total === 0 ? (
        <div className="rounded-lg border bg-card p-12 flex flex-col items-center gap-3 text-center">
          <TreePine className="h-10 w-10 text-primary/30" />
          <p className="font-medium text-muted-foreground">まだ何も育っていません</p>
          <p className="text-sm text-muted-foreground">
            宿題が承認されたり高いテスト点数を取ると、<br />森にアイテムが育ちます
          </p>
        </div>
      ) : (
        <div className="rounded-lg border bg-card p-4 overflow-hidden">
          <GardenCanvas items={items} milestone={milestone} />
        </div>
      )}
    </div>
  )
}
