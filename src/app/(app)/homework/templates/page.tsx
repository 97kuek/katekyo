import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import TemplateManager from "./template-manager"

export default async function TemplatesPage() {
  const session = await auth()
  if (!session || session.user.role !== "teacher") redirect("/dashboard")

  const templates = await db.homeworkTemplate.findMany({
    where: { teacherId: session.user.id },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">宿題テンプレート</h1>
        <p className="text-sm text-muted-foreground mt-1">よく出す宿題を登録しておくと、作成時に呼び出せます</p>
      </div>
      <TemplateManager templates={templates} />
    </div>
  )
}
