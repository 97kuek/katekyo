import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import GardenCanvas from "@/app/(app)/garden/garden-canvas"
import { TreePine } from "lucide-react"

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

  const items = await db.gardenItem.findMany({
    where: { studentId: id },
    select: { x: true, y: true, itemType: true },
  })

  const total = items.length
  const max = 64

  return (
    <div className="space-y-5 max-w-2xl">
      <Link href="/students" className="text-sm text-muted-foreground hover:underline">
        ← 生徒一覧に戻る
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{student.user.name}の森</h1>
        <span className="text-sm tabular-nums text-muted-foreground">
          {total} / {max}
        </span>
      </div>

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

      <p className="text-xs text-muted-foreground text-center">
        宿題が承認されるたびに自動で育ちます
      </p>
    </div>
  )
}
