import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { linkRichMenuToUser } from "@/lib/line"

// LINE連携済みの既存ユーザー全員にリッチメニューを一括適用する一回限りのエンドポイント。
// curl -X POST https://<domain>/api/line/apply-rich-menus \
//   -H "Authorization: Bearer <CRON_SECRET>"

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization")
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const teacherMenuId = process.env.LINE_RICH_MENU_TEACHER_ID
  const studentMenuId = process.env.LINE_RICH_MENU_STUDENT_ID
  if (!teacherMenuId || !studentMenuId) {
    return NextResponse.json({ error: "LINE_RICH_MENU_TEACHER_ID / LINE_RICH_MENU_STUDENT_ID が未設定です" }, { status: 500 })
  }

  const users = await db.user.findMany({
    where: { lineUserId: { not: null } },
    select: { lineUserId: true, role: true },
  })

  let teacher = 0, student = 0, failed = 0

  await Promise.allSettled(
    users.map(async (u) => {
      const menuId = u.role === "teacher" ? teacherMenuId : studentMenuId
      try {
        await linkRichMenuToUser(u.lineUserId!, menuId)
        if (u.role === "teacher") {
          teacher++
        } else {
          student++
        }
      } catch {
        failed++
      }
    })
  )

  return NextResponse.json({ teacher, student, failed, total: users.length })
}
