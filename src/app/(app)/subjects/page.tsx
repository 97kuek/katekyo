import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import SubjectForm from "./subject-form"
import { DeleteSubjectButton } from "./delete-button"

export default async function SubjectsPage() {
  const session = await auth()
  if (!session || session.user.role !== "teacher") redirect("/dashboard")

  const subjects = await db.subject.findMany({
    where: { teacherId: session.user.id },
    orderBy: { createdAt: "asc" },
  })

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold">科目タグ</h1>
        <p className="text-sm text-muted-foreground mt-1">宿題・成績に付けるタグを管理します</p>
      </div>

      <div className="rounded-lg border bg-white p-5 space-y-4">
        <SubjectForm />

        {subjects.length > 0 && (
          <div className="border-t pt-4 space-y-2">
            {subjects.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 py-1.5">
                <span className="text-sm font-medium">{s.name}</span>
                <DeleteSubjectButton id={s.id} />
              </div>
            ))}
          </div>
        )}

        {subjects.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            まだ科目タグがありません
          </p>
        )}
      </div>
    </div>
  )
}
