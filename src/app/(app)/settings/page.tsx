import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { LineSettings, MeetLinkSettings, DeleteParentAccountButton } from "./settings-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { NameForm } from "../profile/name-form"
import { PasswordForm } from "../profile/password-form"
import SubjectForm from "../subjects/subject-form"
import { DeleteSubjectButton } from "../subjects/delete-button"

export default async function SettingsPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const isParent = session.user.role === "parent"

  const [user, subjects] = await Promise.all([
    db.user.findUnique({
      where: { id: session.user.id },
      select: { lineUserId: true, meetLink: true },
    }),
    session.user.role === "teacher"
      ? db.subject.findMany({ where: { teacherId: session.user.id }, orderBy: { createdAt: "asc" } })
      : Promise.resolve([]),
  ])

  return (
    <div className="max-w-lg space-y-8">
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">アカウント</h2>
        <p className="text-sm text-muted-foreground -mt-2">{session.user.email}</p>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">名前の変更</CardTitle>
          </CardHeader>
          <CardContent>
            <NameForm currentName={session.user.name ?? ""} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">パスワードの変更</CardTitle>
          </CardHeader>
          <CardContent>
            <PasswordForm />
          </CardContent>
        </Card>
      </section>

      {!isParent && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">通知</h2>
          <LineSettings isLinked={!!user?.lineUserId} />
          {session.user.role === "teacher" && (
            <MeetLinkSettings currentMeetLink={user?.meetLink ?? null} />
          )}
        </section>
      )}

      {session.user.role === "teacher" && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">タグ管理</h2>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">科目タグ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <SubjectForm />
              {subjects.length > 0 ? (
                <div className="border-t pt-4 space-y-2">
                  {subjects.map((s) => (
                    <div key={s.id} className="flex items-center justify-between gap-3 py-1.5">
                      <span className="text-sm font-medium">{s.name}</span>
                      <DeleteSubjectButton id={s.id} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-2">
                  まだ科目タグがありません
                </p>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {isParent && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">アカウントの削除</h2>
          <Card className="border-destructive/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-destructive">アカウントを削除する</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                アカウントを削除すると、すべての閲覧権限が失われます。削除後は元に戻せません。
              </p>
              <DeleteParentAccountButton />
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  )
}
