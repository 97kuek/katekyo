# LINE通知機能 実装計画書

> **実装状況**: Phase 1〜4 完了済み（2025年5月）

## 概要

LINE Messaging API を使い、宿題・授業に関するリアルタイム通知と月次レポートを
先生・生徒それぞれの LINE に送信する。

---

## 通知一覧

### リアルタイム通知（Server Action トリガー）

| イベント | 受信者 | 送信タイミング | 実装ファイル |
| -------- | -------- | ------------ | ------------ |
| 宿題提出 (submitted) | 先生 | `submitHomework` 実行時 | `homework/[id]/actions.ts` |
| 宿題承認 (approved) | 生徒 | `reviewHomework` 実行時 | `homework/[id]/actions.ts` |
| 宿題差し戻し (rejected) | 生徒 | `reviewHomework` 実行時 | `homework/[id]/actions.ts` |

### 定期通知（Vercel Cron）

| スケジュール | 対象 | 内容 | 実装ファイル |
| ------------ | ---- | ---- | ------------ |
| 毎朝 8:00 JST（23:00 UTC） | 生徒 | 今日期限の宿題 / 期限切れ宿題 | `api/cron/line-daily` |
| 毎月1日 9:00 JST（0:00 UTC） | 先生 | 前月授業レポート（生徒別） | `api/cron/line-monthly` |
| 毎月1日 9:00 JST（0:00 UTC） | 生徒 | 前月学習まとめ | `api/cron/line-monthly` |

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

### 毎朝の宿題リマインダー（生徒）

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

### 月次レポート（生徒）

```
📖 {month}月の学習まとめ

宿題: {approved}件承認 / {total}件
テスト: {testCount}回
森: +{newItems}本育ちました 🌲

引き続きがんばりましょう！
```

---

## 技術設計

### 環境変数

```bash
LINE_CHANNEL_ACCESS_TOKEN=   # Messaging API チャネルアクセストークン
LINE_CHANNEL_SECRET=         # チャネルシークレット（Webhook署名検証用）
NEXTAUTH_URL=                # ベースURL（通知内リンク生成に使用）
CRON_SECRET=                 # Cronエンドポイント認証
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

## 今後の拡張候補

| 機能 | 対象 | 概要 |
| ---- | ---- | ---- |
| 授業リマインダー | 生徒 | 前日夜に翌日の授業日時を通知（Cron追加） |
| 成績通知 | 生徒 | テスト結果が記録されたときにLINE通知 |
| 授業登録通知 | 生徒 | 授業が追加・変更されたときにLINE通知 |
