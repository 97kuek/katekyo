import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { BookOpen } from "lucide-react"

export default async function StudentMaterialsPage() {
  const session = await auth()
  if (!session || session.user.role !== "student") redirect("/dashboard")

  const student = await db.student.findUnique({ where: { userId: session.user.id } })
  if (!student) redirect("/dashboard")

  const materials = await db.studentMaterial.findMany({
    where: { studentId: student.id },
    orderBy: { createdAt: "asc" },
  })

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">教材</h1>
        <p className="text-sm text-muted-foreground mt-1">先生に登録してもらった教材の一覧です</p>
      </div>

      {materials.length === 0 ? (
        <div className="rounded-lg border bg-white p-10 text-center space-y-2">
          <BookOpen className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">教材が登録されていません</p>
        </div>
      ) : (
        <div className="rounded-lg border bg-white divide-y">
          {materials.map((m) => (
            <div key={m.id} className="flex items-center gap-3 px-5 py-4">
              <BookOpen className="h-4 w-4 text-amber-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium">{m.name}</p>
                {m.note && <p className="text-xs text-muted-foreground mt-0.5">{m.note}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
