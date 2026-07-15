# LINE通知 設計・運用仕様

> **文書状態**: Canonical。通知の業務要件は [requirements.md](requirements.md)、HTTP契約は [api-spec.md](api-spec.md) を正本とし、この文書ではLINE固有の設計と運用を補足する。

## 概要

LINE Messaging API を使い、宿題・授業に関するリアルタイム通知と定期リマインダーを
先生・生徒それぞれの LINE に送信する。

---

## 通知一覧

### リアルタイム通知（Server Action トリガー）

| イベント | 受信者 | 送信タイミング | 実装ファイル |
| -------- | -------- | ------------ | ------------ |
| 宿題追加 | 生徒 | `createHomework` 実行時 | `homework/new/actions.ts` |
| 宿題追加（カレンダーから） | 生徒 | `createHomeworkFromCalendar` 実行時 | `calendar/actions.ts` |
| 宿題提出 | 先生 | `submitHomework` 実行時 | `homework/[id]/actions.ts` |
| 宿題差し戻し | 生徒 | `reviewHomework` で rejected 時 | `homework/[id]/actions.ts` |
| ~~宿題承認~~ | ~~生徒~~ | ~~削除~~ | — |
| 生徒の LINE 連携完了 | 先生 | LINE Webhook 受信時 | `api/line/webhook/route.ts` |
| オンライン授業 10 分前 | 生徒・先生 | QStash Webhook（授業登録時に予約） | `api/webhooks/lesson-reminder/route.ts` |

> 宿題承認通知は削除。承認はアプリ上で確認できるため、通知は不要と判断。

### 定期通知（Vercel Cron）

| スケジュール | 対象 | 内容 | 実装ファイル |
| ------------ | ---- | ---- | ------------ |
| 毎日 8:00 JST（23:00 UTC） | 生徒 | 今日期限 / 期限切れ宿題（該当なしは送信しない） | `api/cron/line-daily` |
| 毎週月曜 8:00 JST（日曜 23:00 UTC） | 先生 | 未完了授業リマインダー（line-daily 内で月曜のみ実行） | `api/cron/line-daily` |

---

## メッセージ文面

### 宿題追加通知（生徒）

```text
📝 新しい宿題が追加されました

「{宿題タイトル}」
期限: {M月D日}

https://katekyo-one.vercel.app/homework/{id}
```

### 宿題提出通知（先生）

```text
📬 宿題が提出されました

{生徒名}さんが「{宿題タイトル}」を提出しました。
https://katekyo-one.vercel.app/homework/{id}
```

### 宿題差し戻し通知（生徒）

```text
🔁 宿題が差し戻されました

「{宿題タイトル}」が差し戻されました。

フィードバック：
{teacherFeedback}

https://katekyo-one.vercel.app/homework/{id}
```

### LINE 連携完了通知（先生）

```text
📲 {生徒名}さんがLINE連携を完了しました
これから通知が届くようになります。
```

### オンライン授業 10 分前リマインダー（生徒）

```text
📅 もうすぐ授業が始まります

10分後に授業が始まります。
以下のリンクからGoogle Meetに参加してください。

{meetLink}
```

### オンライン授業 10 分前リマインダー（先生）

```text
📅 まもなく授業があります

{生徒名}さんとの授業が10分後に始まります。

{meetLink}
```

### 宿題リマインダー（生徒・毎日朝 8:00 JST）

```text
📚 宿題リマインダー

【今日が期限】
・{title}

【期限切れ】
・{title}（{M/D}が期限でした）

https://katekyo-one.vercel.app/homework
```

※ 該当する宿題がない場合は送信しない

### 未完了授業リマインダー（先生・毎週月曜 8:00 JST）

```text
📋 未完了の授業があります

・{M/D} {生徒名}さん
・{M/D} {生徒名}さん

完了済みにすると請求に反映されます。
https://katekyo-one.vercel.app/calendar
```

※ 前日以前の未完了授業がない場合は送信しない

---

## 技術設計

### 環境変数

```bash
LINE_CHANNEL_ACCESS_TOKEN=       # Messaging API チャネルアクセストークン
LINE_CHANNEL_SECRET=             # チャネルシークレット（Webhook 署名検証用）
NEXTAUTH_URL=                    # ベースURL（通知内リンク生成に使用）
CRON_SECRET=                     # Cron エンドポイント認証
LINE_RICH_MENU_TEACHER_ID=       # リッチメニューID（先生用）
LINE_RICH_MENU_STUDENT_ID=       # リッチメニューID（生徒用）
QSTASH_TOKEN=                    # QStash API トークン
QSTASH_CURRENT_SIGNING_KEY=      # Webhook 署名検証キー（現在）
QSTASH_NEXT_SIGNING_KEY=         # Webhook 署名検証キー（ローテーション用）
```

> QStash の署名キーは Upstash Console → QStash → **Request Keys** タブで取得。
> これらが未設定だと `verifySignatureAppRouter` が失敗し Meet リマインダーが届かない。

### DB スキーマ

#### User モデルへの追加フィールド

```prisma
lineUserId  String? @unique  // LINE の userId（紐づけ後に設定）
meetLink    String?           // Google Meet 固定 URL（先生のみ）
```

#### LineLinkToken モデル

```prisma
model LineLinkToken {
  id        String   @id @default(uuid())
  userId    String   @unique
  token     String   @unique  // 6桁数字
  expiresAt DateTime @db.Timestamptz(3)
  createdAt DateTime @default(now()) @db.Timestamptz(3)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([token])
}
```

#### Lesson モデルへの追加フィールド

```prisma
qstashMessageId  String?  // QStash メッセージ ID（リマインダーキャンセル用）
```

---

## Cron タイミング設計

| ファイル | vercel.json スケジュール | 実行時刻（JST） | 処理内容 |
| --- | --- | --- | --- |
| `api/cron/cleanup-homework` | `0 18 * * *` | 03:00 JST 毎日 | 期限切れ宿題クリーンアップ |
| `api/cron/line-daily` | `0 23 * * *` | 08:00 JST 毎日 | 生徒: 宿題リマインダー / 先生: 未完了授業（月曜のみ） |

> Vercel Hobby プランは Cron 2 本まで。先生の週次通知は `line-daily` 内でコードレベルで曜日を判定（UTC day === 0 が月曜 8 時 JST）することで 1 本に統合している。

---

## LINE 連携フロー（ユーザー視点）

```text
1. アプリの「設定」ページ → 「LINE連携を開始する」ボタンを押す
2. 6桁のトークンが表示される（10分間有効）
3. LINE公式アカウントを友だち追加する
4. LINE上でトークン（例: 123456）を送信する
5. ボットが「連携完了」メッセージを返す
6. 設定ページに「連携済み」と表示され、通知が届くようになる
7. 生徒が連携した場合、担当の先生のLINEにも連携完了通知が届く
```

---

## Meet リマインダー フロー

```text
1. 先生が設定ページで Google Meet の固定リンクを登録
2. 先生がカレンダーでオンライン授業を登録
   └─ meetLink が設定済みの場合のみ QStash に「授業開始10分前に叩いて」と予約
3. 授業開始10分前に QStash が Webhook を叩く
4. Webhook が生徒・先生それぞれの LINE に Meet リンクを送信
5. 授業を変更・削除した場合は既存 QStash メッセージをキャンセル→再予約
```

---

## ファイル一覧

| ファイル | 役割 |
| --- | --- |
| `src/lib/line.ts` | `sendLineMessage` ヘルパー（fire-and-forget） |
| `src/lib/qstash.ts` | QStash スケジュール・キャンセルヘルパー |
| `src/app/api/line/webhook/route.ts` | LINE からの Webhook 受信・処理 |
| `src/app/api/webhooks/lesson-reminder/route.ts` | QStash から叩かれる Webhook（生徒・先生両方に送信） |
| `src/app/api/cron/line-daily/route.ts` | 毎日朝 8:00 JST の Cron（生徒: 宿題リマインダー / 先生: 未完了授業） |
| `src/app/(app)/settings/actions.ts` | `generateLinkToken` / `unlinkLine` / `saveMeetLink` |
| `src/app/(app)/homework/new/actions.ts` | 宿題追加時に生徒へ LINE 通知 |
| `src/app/(app)/calendar/actions.ts` | カレンダーから宿題追加時に生徒へ LINE 通知 |
| `src/app/(app)/homework/[id]/actions.ts` | 提出時→先生 / 差し戻し時→生徒 に LINE 通知 |

---

## 注意事項

- LINE Messaging API の無料枠: **月 1000 通**（先生 1 名 + 生徒数名なら余裕）
- `sendLineMessage` は fire-and-forget（通知失敗でも宿題操作自体は成功させる）
- `lineUserId` が null のユーザーはすべての通知処理をスキップ
- Cron エンドポイントは `Authorization: Bearer CRON_SECRET` で認証
- LINE OAM の「応答メッセージ」は **オフ** にすること（二重返信防止）
- 通知内 URL のベースは `NEXTAUTH_URL` 環境変数から生成
- QStash の署名キー（`QSTASH_CURRENT_SIGNING_KEY` / `QSTASH_NEXT_SIGNING_KEY`）を Vercel に設定しないと Meet リマインダーの Webhook 検証が失敗する

---

## リッチメニュー（2026年5月実装）

先生・生徒それぞれに専用リッチメニューを表示する。

### メニュー構成

| ロール | タイル1 | タイル2 | タイル3 |
| --- | --- | --- | --- |
| 先生 | 提出確認（clipboardCheck） | 授業管理（calendar） | 請求管理（receipt） |
| 生徒 | 宿題（bookOpen） | 学習の森（leaf） | カレンダー（calendar） |

### 初期セットアップ手順

1. `node scripts/generate-rich-menu.mjs` — PNG 画像を `public/` に生成
2. `POST /api/line/setup-rich-menus` — LINE API でメニュー定義を作成
3. 返却された ID を `.env.local` と Vercel 環境変数に設定
4. `node scripts/upload-rich-menu-images.mjs` — PNG を LINE API にアップロード
5. `POST /api/line/apply-rich-menus` — 既存 LINE 連携ユーザー全員に一括適用
