# LINE通知機能 実装計画書

> **実装状況**: Phase 1〜4 完了済み（2025年5月）、追加実装あり（2026年5月）

## 概要

LINE Messaging API を使い、宿題・授業に関するリアルタイム通知と月次レポートを
先生・生徒それぞれの LINE に送信する。

---

## 通知一覧

### リアルタイム通知（Server Action / Webhook トリガー）

| イベント | 受信者 | 送信タイミング | 実装ファイル |
| -------- | -------- | ------------ | ------------ |
| 宿題提出 (submitted) | 先生 | `submitHomework` 実行時 | `homework/[id]/actions.ts` |
| 宿題承認 (approved) | 生徒 | `reviewHomework` 実行時 | `homework/[id]/actions.ts` |
| 宿題差し戻し (rejected) | 生徒 | `reviewHomework` 実行時 | `homework/[id]/actions.ts` |
| 生徒のLINE連携完了 | 先生 | LINE Webhook 受信時（生徒が6桁コードを送信した瞬間） | `api/line/webhook/route.ts` |
| オンライン授業10分前 | 生徒 | QStash Webhook（授業登録時に予約） | `api/webhooks/lesson-reminder/route.ts` |

### 定期通知（Vercel Cron）

| スケジュール | 対象 | 内容 | 実装ファイル |
| ------------ | ---- | ---- | ------------ |
| 毎週日曜 8:00 JST（23:00 UTC） | 生徒 | 今日期限の宿題 / 期限切れ宿題（該当なしは送信しない） | `api/cron/line-daily` |
| 毎月1日 9:00 JST（0:00 UTC） | 先生 | 前月授業レポート（生徒別）※line-monthly Cron は Vercel Hobby プラン上限のため削除済み | `api/cron/line-monthly`（削除済み） |

---

## メッセージ文面

### 宿題提出通知（先生）

```
📬 宿題が提出されました

{生徒名}さんが「{宿題タイトル}」を提出しました。
https://katekyo-one.vercel.app/homework/{id}
```

### 宿題承認通知（生徒）

```
✅ 宿題が承認されました

「{宿題タイトル}」が承認されました！
森に植物が1つ育ちました 🌱
https://katekyo-one.vercel.app/homework/{id}
```

### 宿題差し戻し通知（生徒）

```
🔁 宿題が差し戻されました

「{宿題タイトル}」が差し戻されました。

フィードバック：
{teacherFeedback}

https://katekyo-one.vercel.app/homework/{id}
```

### LINE連携完了通知（先生）

```
📲 {生徒名}さんがLINE連携を完了しました
これから通知が届くようになります。
```

### オンライン授業10分前リマインダー（生徒）

```
📅 もうすぐ授業が始まります

10分後に授業が始まります。
以下のリンクからGoogle Meetに参加してください。

{meetLink}
```

※ 先生の `meetLink` が未設定、または生徒が LINE 未連携の場合はスキップ。詳細は [meet-reminder-plan.md](meet-reminder-plan.md)

### 毎週の宿題リマインダー（生徒・毎週日曜）

```
📚 宿題リマインダー

【今日が期限】
・{title}

【期限切れ】
・{title}（{dueDate}が期限でした）

https://katekyo-one.vercel.app/homework
```

※ 該当する宿題がない場合は送信しない

### 月次レポート（先生）

```
📊 {month}月の授業レポート

▶ {生徒名}
　授業: {count}回 / {totalMin}分
　請求: ¥{amount:,}
　宿題承認率: {rate}%

─────────
合計請求額: ¥{totalAmount:,}
```

---

## 技術設計

### 環境変数

```bash
LINE_CHANNEL_ACCESS_TOKEN=       # Messaging API チャネルアクセストークン
LINE_CHANNEL_SECRET=             # チャネルシークレット（Webhook署名検証用）
NEXTAUTH_URL=                    # ベースURL（通知内リンク生成に使用）
CRON_SECRET=                     # Cronエンドポイント認証
LINE_RICH_MENU_TEACHER_ID=       # リッチメニューID（先生用）
LINE_RICH_MENU_STUDENT_ID=       # リッチメニューID（生徒用）
```

### DBスキーマ

#### User モデルへの追加フィールド

```prisma
lineUserId  String? @unique  // LINE の userId（紐づけ後に設定）
```

#### LineLinkToken モデル

```prisma
model LineLinkToken {
  id        String   @id @default(uuid())
  userId    String   @unique          // 1ユーザーにトークンは1つ
  token     String   @unique          // 6桁数字
  expiresAt DateTime                  // 発行から10分後
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([token])
}
```

---

## LINE連携フロー（ユーザー視点）

```
1. アプリの「設定」ページ → 「LINE連携を開始する」ボタンを押す
2. 6桁のトークンが表示される（10分間有効）
3. LINE公式アカウントを友だち追加する
4. LINE上でトークン（例: 123456）を送信する
5. ボットが「連携完了」メッセージを返す
6. 設定ページに「連携済み」と表示され、通知が届くようになる
7. 生徒が連携した場合、担当の先生のLINEにも連携完了通知が届く
```

---

## ファイル一覧

### 新規作成ファイル

| ファイル | 役割 |
|--------|------|
| `src/lib/line.ts` | `sendLineMessage(lineUserId, text)` ヘルパー（fire-and-forget） |
| `src/app/api/line/webhook/route.ts` | LINEからのWebhookを受信・処理 |
| `src/app/(app)/settings/page.tsx` | LINE連携設定ページ（Server Component） |
| `src/app/(app)/settings/actions.ts` | `generateLinkToken` / `unlinkLine` |
| `src/app/(app)/settings/settings-client.tsx` | `LineSettings` クライアントコンポーネント |
| `src/app/api/cron/line-daily/route.ts` | 毎朝リマインダーCron |
| `src/app/api/cron/line-monthly/route.ts` | 月次レポートCron |

### 変更ファイル

| ファイル | 変更内容 |
|--------|--------|
| `prisma/schema.prisma` | `User.lineUserId`、`LineLinkToken` モデル追加 |
| `src/app/(app)/homework/[id]/actions.ts` | submit/approve/reject 時にLINE通知送信（URL付き） |
| `src/components/layout/sidebar.tsx` | 「設定」リンク追加 |
| `src/components/layout/header.tsx` | 「設定」リンク追加（モバイルヘッダー） |
| `vercel.json` | Cronエントリ2件追加 |

---

## Webhook セキュリティ

```typescript
// X-Line-Signature ヘッダーで本物のLINEリクエストか検証
import { createHmac } from "crypto"

function verifyLineSignature(body: string, signature: string): boolean {
  const hash = createHmac("SHA256", process.env.LINE_CHANNEL_SECRET!)
    .update(body)
    .digest("base64")
  return hash === signature
}
```

---

## 注意事項

- LINE Messaging API の無料枠: **月1000通**（先生1名 + 生徒数名の構成なら十分）
- `sendLineMessage` は fire-and-forget（通知失敗でも宿題操作自体は成功させる）
- `lineUserId` が null のユーザーはすべての通知処理をスキップ
- Cronエンドポイントは `Authorization: Bearer CRON_SECRET` で認証
- LINE OAM の「応答メッセージ」は **オフ** にすること（二重返信防止）
- 通知内URLのベースは `NEXTAUTH_URL` 環境変数から生成

---

## リッチメニュー（2026年5月実装）

先生・生徒それぞれに専用リッチメニューを表示する。メニューは LINE OA Manager ではなく **Messaging API（Linked Rich Menu）** で管理するため、OA Manager の画面には表示されない。

### メニュー構成

| ロール | タイル1 | タイル2 | タイル3 |
| --- | --- | --- | --- |
| 先生 | 提出確認（clipboardCheck） | 授業管理（calendar） | 請求管理（receipt） |
| 生徒 | 宿題（bookOpen） | 学習の森（leaf） | カレンダー（calendar） |

画像: 2500×843px PNG、白背景、アイコン色 `#2e743a`（katekyo primary green）

### 初期セットアップ手順

1. `node scripts/generate-rich-menu.mjs` — PNG 画像を `public/` に生成（`sharp` 使用）
2. `POST /api/line/setup-rich-menus` — LINE API でメニュー定義を作成し ID を返す
3. 返却された ID を `.env.local` と Vercel 環境変数に設定
4. `node scripts/upload-rich-menu-images.mjs` — PNG を LINE API にアップロード
5. `POST /api/line/apply-rich-menus` — 既存 LINE 連携ユーザー全員に一括適用

### 自動適用タイミング

- **新規連携時**: `api/line/webhook/route.ts` でユーザーの role に応じたメニューを即適用
- **連携解除時**: `settings/actions.ts` の `unlinkLine` でメニューを解除してから DB をクリア

### 関連ファイル

| ファイル | 役割 |
| --- | --- |
| `src/lib/line.ts` | `linkRichMenuToUser` / `unlinkRichMenuFromUser` ヘルパー |
| `src/app/api/line/setup-rich-menus/route.ts` | メニュー定義を LINE API に登録（一回限り） |
| `src/app/api/line/apply-rich-menus/route.ts` | 既存ユーザーに一括適用（一回限り） |
| `scripts/generate-rich-menu.mjs` | SVG → PNG 変換（sharp） |
| `scripts/upload-rich-menu-images.mjs` | PNG を LINE API にアップロード |

---

## 今後の拡張候補

| 機能 | 対象 | 概要 |
| ---- | ---- | ---- |
| 前日授業リマインダー | 生徒 | 前日夜に翌日の授業日時を通知（Cron追加） |
| 新規宿題追加通知 | 生徒 | 先生が宿題を追加したとき即時通知 |
| 成績登録通知 | 生徒 | テスト結果が記録されたときにLINE通知 |
| 未完了授業リマインダー | 先生 | 週1回、完了し忘れた授業がある場合に通知（請求漏れ防止） |
