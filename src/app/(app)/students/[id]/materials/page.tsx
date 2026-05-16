import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import { AddMaterialForm } from "./add-material-form"
import { DeleteMaterialButton } from "./delete-material-button"

export default async function StudentMaterialsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== "teacher") redirect("/dashboard")

  const { id } = await params

  const student = await db.student.findFirst({
    where: { id, teacherId: session.user.id },
    include: { user: { select: { name: true } } },
  })
  if (!student) notFound()

  const materials = await db.studentMaterial.findMany({
    where: { studentId: id, teacherId: session.user.id },
    orderBy: { createdAt: "asc" },
  })

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/students" className="text-sm text-muted-foreground hover:underline">
          ← 生徒一覧に戻る
        </Link>
        <h1 className="text-2xl font-bold mt-2">{student.user.name} の使用教材</h1>
        <p className="text-sm text-muted-foreground mt-1">
          宿題作成時に教材を紐づけられます
        </p>
      </div>

      <div className="rounded-lg border bg-white p-5 space-y-4">
        <h2 className="text-sm font-semibold">教材を追加</h2>
        <AddMaterialForm studentId={id} />
      </div>

      {materials.length === 0 ? (
        <div className="rounded-lg border bg-white p-10 text-center">
          <p className="text-sm text-muted-foreground">教材が登録されていません</p>
        </div>
      ) : (
        <div className="rounded-lg border bg-white divide-y">
          {materials.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{m.name}</p>
                {m.note && <p className="text-xs text-muted-foreground truncate">{m.note}</p>}
              </div>
              <DeleteMaterialButton materialId={m.id} studentId={id} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
