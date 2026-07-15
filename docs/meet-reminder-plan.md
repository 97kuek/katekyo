# Google Meet 授業前リマインダー 設計・運用仕様

> **文書状態**: Canonical。通知条件は [requirements.md](requirements.md)、エンドポイント契約は [api-spec.md](api-spec.md) を正本とし、この文書ではQStashとcronの運用を補足する。

## 概要

オンライン授業の開始 10 分前に、生徒の LINE へ Google Meet リンクを自動送信する。
スケジューリングには [Upstash QStash](https://upstash.com/docs/qstash/overall/getstarted) を使用する（Vercel Hobby プランでは Cron の最短間隔が 1 日のため）。

---

## ユーザーフロー

```
1. 先生が設定ページで Google Meet の固定リンクを登録
   └─ 登録済みリンクは「開く」ボタンで動作確認可能。保存時にトーストで確認
2. 先生がカレンダーでオンライン授業を登録
   └─ Server Action が QStash に「授業開始 10 分前に叩いて」と予約
3. 授業開始 10 分前になると QStash が Webhook を叩く
4. Webhook が生徒の LINE に Meet リンクを送信
5. 生徒・先生ともカレンダーの授業カードと「次の授業」バナーから Meet に直接参加可能
```

---

## 設計ポイント

### Meet リンクの扱い

- 先生 1 名につき 1 つの固定リンク（Google Meet のパーソナルルーム URL）
- `User.meetLink` に保存
- 先生が設定ページで自由に更新可能

### QStash を選んだ理由

| 方式 | 問題 |
|------|------|
| Vercel Cron（毎分） | Hobby プランでは最短間隔が 1 日 |
| Cron（毎時）+ DB クエリ | 最大 60 分の遅延が生じる |
| QStash（遅延キュー） | 指定時刻ちょうどに Webhook を叩ける。無料枠 500 msg/月 |

### 授業変更・削除への対応

授業の日時変更や削除があった場合、古い QStash メッセージをキャンセルして再予約（または削除）する。
そのために `Lesson.qstashMessageId` に QStash のメッセージ ID を保持する。

### 繰り返し授業（repeatWeeks）

`createMany` ではなく `create` をループして各 Lesson の ID を取得し、それぞれ QStash を予約する。

---

## DB 変更

### User モデルへの追加

```prisma
meetLink  String?  // Google Meet 固定 URL
```

### Lesson モデルへの追加

```prisma
qstashMessageId  String?  // QStash メッセージ ID（リマインダーキャンセル用）
```

---

## 通知送信条件

| 条件 | 動作 |
|------|------|
| `type === "online"` | QStash 予約対象 |
| `type === "offline"` | 予約しない |
| 先生の `meetLink` が未設定 | 予約しない |
| 生徒の `lineUserId` が未設定 | Webhook 到達時にスキップ（fire-and-forget） |
| 授業開始まで 10 分未満（過去日登録） | 予約しない |

---

## 通知文面

```
📅 もうすぐ授業が始まります

10分後に授業が始まります。
以下のリンクからGoogle Meetに参加してください。

{meetLink}
```

---

## 環境変数

```bash
QSTASH_TOKEN=                  # QStash API トークン
QSTASH_CURRENT_SIGNING_KEY=    # Webhook 署名検証キー（現在）
QSTASH_NEXT_SIGNING_KEY=       # Webhook 署名検証キー（ローテーション用）
```

Upstash Console → QStash → 「Request Keys」タブで取得。

---

## ファイル一覧

### 新規作成

| ファイル | 役割 |
|--------|------|
| `src/lib/qstash.ts` | QStash クライアント初期化・予約・キャンセルヘルパー |
| `src/app/api/webhooks/lesson-reminder/route.ts` | QStash から叩かれる Webhook。LINE 送信を実行 |

### 変更

| ファイル | 変更内容 |
|--------|--------|
| `prisma/schema.prisma` | `User.meetLink`、`Lesson.qstashMessageId` を追加 |
| `src/app/(app)/settings/actions.ts` | `saveMeetLink` アクションを追加 |
| `src/app/(app)/settings/settings-client.tsx` | `MeetLinkSettings` コンポーネントを追加（登録済み表示・「開く」ボタン・取得手順・保存トースト） |
| `src/app/(app)/settings/page.tsx` | 先生ロールのみ Meet リンク設定セクションを表示 |
| `src/app/(app)/calendar/actions.ts` | `createLesson` / `updateLesson` / `deleteLesson` に QStash 連携を追加 |
| `src/app/(app)/calendar/page.tsx` | 先生・生徒クエリで `teacher.meetLink` を取得 |
| `src/app/(app)/calendar/calendar-view.tsx` | 授業カードと次の授業バナーに「Meet に参加する」ボタンを追加 |
| `docs/data-models.md` | `User.meetLink`、`Lesson.qstashMessageId` を追記 |
| `docs/api-spec.md` | `saveMeetLink`・Webhook エンドポイントを追記 |
| `docs/requirements.md` | Meet リマインダー仕様を追記 |

---

## QStash API メモ

```typescript
// 予約（delaySeconds 秒後に url を叩く）
const client = new Client({ token: process.env.QSTASH_TOKEN! })
const { messageId } = await client.publishJSON({
  url: `${process.env.NEXTAUTH_URL}/api/webhooks/lesson-reminder`,
  delay: delaySeconds,
  body: { lessonId },
})

// キャンセル
await client.messages.delete(messageId)
```

---

## Webhook セキュリティ

```typescript
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs"

export const POST = verifySignatureAppRouter(async (req) => {
  const { lessonId } = await req.json()
  // LINE 送信処理
})
```

---

## 注意事項

- QStash 無料枠: 月 500 メッセージ。週 2 コマ × 4 週 = 月 8 件なら余裕
- `meetLink` が後から変更されても、Webhook 到達時に DB から最新値を取得するので問題なし
- 授業を `offline → online` に変更した場合も QStash を新規予約する
- 授業を `online → offline` に変更した場合は既存 QStash メッセージをキャンセル

---

## 安定化（cron セーフティネット） — 2026-06 追記

QStash の per-lesson 予約は「一度きり配信」で、失敗すると復旧せず不安定だった（issue #2）。
そこで開始10分前後のオンライン授業を定期スキャンして配信する自己修復エンドポイントを追加した。

- エンドポイント: `GET|POST /api/cron/lesson-reminder`（`Authorization: Bearer CRON_SECRET`）
  - `now+2分〜now+13分` に始まる `type=online` / `completedAt=null` / `reminderSentAt=null` の授業を対象
  - `Lesson.reminderSentAt` で QStash Webhook 経路と冪等共存（二重送信しない）
- 起動方法（プラン別）:
  - **Vercel Pro**: `vercel.json` に `{ "path": "/api/cron/lesson-reminder", "schedule": "*/5 * * * *" }` を追加
  - **Vercel Hobby**（cron 最大2個・1日1回の制限）: QStash Schedule を使う。デプロイ後に一度だけ実行:
    ```bash
    curl -X POST https://<your-domain>/api/qstash/setup-reminder-schedule \
      -H "Authorization: Bearer <CRON_SECRET>"
    ```
    `*/5 * * * *` の QStash Schedule が作成され、`Authorization` ヘッダ付きで上記エンドポイントを叩く。
    再実行しても同一 destination の既存スケジュールを削除してから作り直すため重複しない。
