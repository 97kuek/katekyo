import { NextRequest, NextResponse } from "next/server"

// 一度だけ実行してリッチメニューIDを取得する管理用エンドポイント。
// curl -X POST https://<your-domain>/api/line/setup-rich-menus \
//   -H "Authorization: Bearer <CRON_SECRET>"
// 返却された teacherMenuId / studentMenuId を Vercel 環境変数に設定する。
//   LINE_RICH_MENU_TEACHER_ID=richmenu-xxx
//   LINE_RICH_MENU_STUDENT_ID=richmenu-yyy
// その後、LINE Official Account Manager で各メニューに画像をアップロードする。

const MENU_SIZE = { width: 2500, height: 843 }
const TILE_H = 843

function buildMenu(name: string, areas: { label: string; uri: string }[]) {
  const tileW = Math.floor(2500 / areas.length)
  return {
    size: MENU_SIZE,
    selected: true,
    name,
    chatBarText: "メニュー",
    areas: areas.map((a, i) => ({
      bounds: {
        x: i * tileW,
        y: 0,
        width: i === areas.length - 1 ? 2500 - i * tileW : tileW,
        height: TILE_H,
      },
      action: { type: "uri", label: a.label, uri: a.uri },
    })),
  }
}

async function createMenu(token: string, menu: object): Promise<string | null> {
  const res = await fetch("https://api.line.me/v2/bot/richmenu", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(menu),
  })
  if (!res.ok) {
    const text = await res.text()
    console.error("[setup-rich-menus] create failed:", res.status, text)
    return null
  }
  const data = await res.json()
  return (data.richMenuId as string) ?? null
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization")
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  if (!token) {
    return NextResponse.json({ error: "LINE_CHANNEL_ACCESS_TOKEN is not set" }, { status: 500 })
  }

  const baseUrl = (process.env.NEXTAUTH_URL ?? "").replace(/\/$/, "")

  const teacherMenu = buildMenu("Teacher Menu", [
    { label: "提出確認", uri: `${baseUrl}/homework` },
    { label: "授業管理", uri: `${baseUrl}/calendar` },
    { label: "請求管理", uri: `${baseUrl}/billing` },
  ])

  const studentMenu = buildMenu("Student Menu", [
    { label: "宿題", uri: `${baseUrl}/homework` },
    { label: "学習の森", uri: `${baseUrl}/garden` },
    { label: "カレンダー", uri: `${baseUrl}/calendar` },
  ])

  const [teacherMenuId, studentMenuId] = await Promise.all([
    createMenu(token, teacherMenu),
    createMenu(token, studentMenu),
  ])

  if (!teacherMenuId || !studentMenuId) {
    return NextResponse.json({ error: "メニュー作成に失敗しました。LINE_CHANNEL_ACCESS_TOKEN を確認してください。" }, { status: 500 })
  }

  return NextResponse.json({
    teacherMenuId,
    studentMenuId,
    next: [
      `Vercel に LINE_RICH_MENU_TEACHER_ID=${teacherMenuId} を追加`,
      `Vercel に LINE_RICH_MENU_STUDENT_ID=${studentMenuId} を追加`,
      "LINE Official Account Manager でそれぞれのメニューに画像（2500×843px）をアップロード",
    ],
  })
}
