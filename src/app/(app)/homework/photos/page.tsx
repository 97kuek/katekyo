import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import { ImageIcon } from "lucide-react"

export default async function HomeworkPhotosPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>
}) {
  const session = await auth()
  if (!session || session.user.role !== "teacher") redirect("/dashboard")

  const { studentId } = await searchParams

  const [homeworks, students] = await Promise.all([
    db.homework.findMany({
      where: {
        teacherId: session.user.id,
        photoUrl: { not: null },
        ...(studentId ? { studentId } : {}),
      },
      include: { student: { include: { user: { select: { name: true } } } } },
      orderBy: { submittedAt: "desc" },
    }),
    db.student.findMany({
      where: { teacherId: session.user.id },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ])

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">提出写真</h1>
          <p className="text-sm text-muted-foreground mt-1">生徒が提出した宿題の写真一覧</p>
        </div>
      </div>

      {/* Student filter */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/homework/photos"
          className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${!studentId ? "bg-primary text-primary-foreground border-primary" : "bg-white text-muted-foreground border-input hover:bg-gray-50"}`}
        >
          すべて
        </Link>
        {students.map((s) => (
          <Link
            key={s.id}
            href={`/homework/photos?studentId=${s.id}`}
            className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${studentId === s.id ? "bg-primary text-primary-foreground border-primary" : "bg-white text-muted-foreground border-input hover:bg-gray-50"}`}
          >
            {s.user.name}
          </Link>
        ))}
      </div>

      {homeworks.length === 0 ? (
        <div className="rounded-lg border bg-white p-12 text-center space-y-2">
          <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">提出写真はまだありません</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {homeworks.map((h) => (
            <Link
              key={h.id}
              href={`/homework/${h.id}`}
              className="group rounded-lg border bg-white overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={h.photoUrl!}
                alt={h.title}
                className="w-full aspect-square object-cover bg-gray-100 group-hover:opacity-90 transition-opacity"
              />
              <div className="p-2">
                <p className="text-xs font-medium truncate">{h.title}</p>
                <p className="text-xs text-muted-foreground truncate">{h.student.user.name}</p>
                {h.submittedAt && (
                  <p className="text-xs text-muted-foreground">
                    {h.submittedAt.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
