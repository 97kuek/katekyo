import { redirect } from "next/navigation"
import { getViewingContext } from "@/lib/view-as"
import { db } from "@/lib/db"
import { BookOpen } from "lucide-react"

export default async function StudentMaterialsPage() {
  const ctx = await getViewingContext()
  if (!ctx || ctx.effectiveRole !== "student") redirect("/dashboard")

  const student = await db.student.findUnique({ where: { userId: ctx.effectiveUserId } })
  if (!student) redirect("/dashboard")

  const [materials, subjects] = await Promise.all([
    db.studentMaterial.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: "asc" },
    }),
    db.subject.findMany({
      where: { teacherId: student.teacherId },
      select: { id: true, name: true },
    }),
  ])

  const subjectMap = new Map(subjects.map((s) => [s.id, s.name]))

  return (
    <div className="max-w-2xl space-y-6">
      <p className="text-sm text-muted-foreground">先生に登録してもらった教材の一覧です</p>

      {materials.length === 0 ? (
        <div className="rounded-lg border bg-card p-10 text-center space-y-2">
          <BookOpen className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">教材が登録されていません</p>
        </div>
      ) : (
        <div className="rounded-lg border bg-card divide-y">
          {materials.map((m) => (
            <div key={m.id} className="flex items-center gap-3 px-5 py-4">
              <BookOpen className="h-4 w-4 text-warning shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium">{m.name}</p>
                {m.note && <p className="text-xs text-muted-foreground mt-0.5">{m.note}</p>}
                {m.subjectIds.length > 0 && (
                  <div className="flex gap-1 flex-wrap mt-1">
                    {m.subjectIds.map((sid) => {
                      const name = subjectMap.get(sid)
                      return name ? (
                        <span key={sid} className="text-xs bg-muted text-foreground rounded px-1.5 py-0.5">
                          {name}
                        </span>
                      ) : null
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
