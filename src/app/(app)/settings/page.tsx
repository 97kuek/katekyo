import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { GoogleAuthSettings, LineSettings, MeetLinkSettings, DeleteParentAccountButton } from "./settings-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { NameForm } from "../profile/name-form"
import { PasswordForm } from "../profile/password-form"
import SubjectForm from "../subjects/subject-form"
import { DeleteSubjectButton } from "../subjects/delete-button"
import { SubjectColorEditor } from "../subjects/subject-color-editor"
import { PageHeader } from "@/components/ui/page-header"
import { Disclosure } from "@/components/ui/disclosure"

export default async function SettingsPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const isParent = session.user.role === "parent"

  const [user, subjects] = await Promise.all([
    db.user.findUnique({
      where: { id: session.user.id },
      select: {
        lineUserId: true,
        meetLink: true,
        identityAccesses: { where: { identity: { provider: "google" } }, select: { id: true } },
      },
    }),
    session.user.role === "teacher"
      ? db.subject.findMany({ where: { teacherId: session.user.id }, orderBy: { createdAt: "asc" } })
      : Promise.resolve([]),
  ])

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <PageHeader title="設定" description="変更したい項目を選んでください。" />
      <Disclosure title="アカウント" description={`${session.user.email}・名前・パスワード・Google連携`}>
        <div className="space-y-4">
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
        <GoogleAuthSettings isLinked={Boolean(user?.identityAccesses.length)} />
        </div>
      </Disclosure>

      {!isParent && (
        <Disclosure title="通知・オンライン授業" description={`LINE ${user?.lineUserId ? "連携済み" : "未連携"}${session.user.role === "teacher" ? `・Meet ${user?.meetLink ? "設定済み" : "未設定"}` : ""}`}>
          <div className="space-y-4">
          <LineSettings isLinked={!!user?.lineUserId} />
          {session.user.role === "teacher" && (
            <MeetLinkSettings currentMeetLink={user?.meetLink ?? null} />
          )}
          </div>
        </Disclosure>
      )}

      {session.user.role === "teacher" && (
        <Disclosure title="科目タグ" description={`${subjects.length}件の科目を登録済み`}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">科目タグ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <SubjectForm />
              {subjects.length > 0 ? (
                <div className="border-t pt-4 space-y-2">
                  {subjects.map((s) => (
                    <div key={s.id} className="relative flex items-center justify-between gap-3 py-1.5">
                      <SubjectColorEditor id={s.id} name={s.name} color={s.color} />
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
        </Disclosure>
      )}

      {isParent && (
        <Disclosure title="アカウントの削除" description="閲覧権限を含むすべてのデータを削除" className="border-destructive/30">
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
        </Disclosure>
      )}
    </div>
  )
}
