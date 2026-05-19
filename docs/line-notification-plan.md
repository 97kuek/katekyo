# LINE通知機能 実装計画書

## 概要

LINE Messaging API を使い、宿題・授業に関するリアルタイム通知と月次レポートを  先生・生徒それぞれの LINE に送信する。

---

## 通知一覧

### リアルタイム通知（Server Action トリガー）

| イベント | 受信者 | 送信タイミング |
|--------|--------|------------|
| 宿題提出 (submitted) | 先生 | `submitHomework` 実行時 |
| 宿題承認 (approved) | 生徒 | `approveHomework` 実行時 |
| 宿題差し戻し (rejected) | 生徒 | `rejectHomework` 実行時 |

### 定期通知（Vercel Cron）

| スケジュール | 対象 | 内容 |
|------------|------|------|
| 毎朝 8:00 JST（23:00 UTC） | 生徒 | 今日期限の宿題 / 期限切れ宿題 |
| 毎月1日 9:00 JST（0:00 UTC） | 先生 | 前月授業レポート（生徒別） |
| 毎月1日 9:00 JST（0:00 UTC） | 生徒 | 前月学習まとめ |

---

## メッセージ文面

### 宿題提出通知（先生）

```
📬 宿題が提出されました

{生徒名}さんが「{宿題タイトル}」を提出しました。
katekyoで確認してください。
```

### 宿題承認通知（生徒）

```
✅ 宿題が承認されました

「{宿題タイトル}」が承認されました！
森に植物が1つ育ちました 🌱
```

### 宿題差し戻し通知（生徒）

```
🔁 宿題が差し戻されました

「{宿題タイトル}」が差し戻されました。

フィードバック：
{teacherFeedback}

katekyoで確認してください。
```

### 毎朝の宿題リマインダー（生徒）

```
📚 宿題リマインダー

【今日が期限】
・{title}

【期限切れ】
・{title}（{dueDate}が期限でした）
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

### 環境変数（追加）

```bash
LINE_CHANNEL_ACCESS_TOKEN=   # Messaging API チャネルアクセストークン
LINE_CHANNEL_SECRET=         # チャネルシークレット（Webhook署名検証用）
```

### DBスキーマ変更（`prisma/schema.prisma`）

#### User モデルに追加

```prisma
model User {
  // 既存フィールド...
  lineUserId  String?   // LINE の userId（紐づけ後に設定）
}
```

#### 新規モデル追加

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
1. アプリの「設定」ページ → 「LINE連携」ボタンを押す
2. 6桁のトークンが表示される（10分間有効）
3. LINE公式アカウントを友だち追加する（QRコード掲載）
4. LINE上でトークン（例: 123456）を送信する
5. ボットが「連携完了」メッセージを返す
6. 設定ページに「連携済み」と表示され、通知が届くようになる
```

---

## 新規ファイル一覧

| ファイル | 役割 |
|--------|------|
| `src/lib/line.ts` | `sendLineMessage(lineUserId, text)` ヘルパー |
| `src/app/api/line/webhook/route.ts` | LINEからのWebhookを受信・処理 |
| `src/app/(app)/settings/page.tsx` | LINE連携設定ページ |
| `src/app/(app)/settings/actions.ts` | `generateLinkToken` / `unlinkLine` |
| `src/app/api/cron/line-daily/route.ts` | 毎朝リマインダーCron |
| `src/app/api/cron/line-monthly/route.ts` | 月次レポートCron |

## 変更ファイル一覧

| ファイル | 変更内容 |
|--------|--------|
| `prisma/schema.prisma` | `User.lineUserId`、`LineLinkToken` モデル追加 |
| `src/app/(app)/homework/[id]/actions.ts` | approve/reject/submit 時にLINE通知送信 |
| `src/components/layout/sidebar.tsx` | 「設定」リンク追加 |
| `src/components/layout/bottom-nav.tsx` | 「設定」リンク追加（先生・生徒共通） |
| `vercel.json` | Cronエントリ2件追加 |
| `.env.local` | LINE環境変数2件追加 |
| `CLAUDE.md` | docs テーブルにこのファイルを追記 |

---

## 実装フェーズ

### Phase 1: DB + LINE基盤（1〜2時間）

1. `prisma/schema.prisma` に `User.lineUserId`、`LineLinkToken` 追加
2. `npx prisma migrate dev --name add-line-integration`
3. `src/lib/line.ts` 作成（`sendLineMessage` 関数）
4. `/api/line/webhook` 作成
   - `X-Line-Signature` ヘッダーで署名検証
   - `follow` イベント: 「連携するには6桁コードをkatekyoで発行して送信してください」
   - `message` イベント（6桁数字）: `LineLinkToken` を検索 → `User.lineUserId` 更新 → 完了メッセージ

### Phase 2: LINE連携UI（30分〜1時間）

5. `/settings` ページ作成
   - 連携状態の表示（未連携 / 連携済み: LINEアカウント名）
   - 「連携する」→ トークン表示 + QRコード
   - 「連携を解除する」→ `lineUserId` を null に
6. サイドバー・ボトムナビに設定アイコン追加

### Phase 3: リアルタイム通知（30分）

7. `homework/[id]/actions.ts` の各 action に `sendLineMessage` を追加
   - `approveHomework`: 生徒に承認通知
   - `rejectHomework`: 生徒に差し戻し通知
   - `submitHomework`: 先生に提出通知
   - いずれも `lineUserId` が null の場合はスキップ（通知しない）

### Phase 4: Cron通知（1〜2時間）

8. `/api/cron/line-daily` 作成（毎朝8:00 JST）
   - `lineUserId` が設定された全生徒をクエリ
   - 各生徒の今日期限・期限切れ宿題を集計
   - 該当あれば `sendLineMessage` でリマインダー送信
9. `/api/cron/line-monthly` 作成（毎月1日9:00 JST）
   - 先生向け: 前月の授業・請求サマリーを生徒別に集計して送信
   - 生徒向け: 前月の宿題・テスト・森サマリーを送信
10. `vercel.json` に2件のCronスケジュール追加

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
- リアルタイム通知は `sendLineMessage` を fire-and-forget で呼ぶ（通知失敗でも宿題操作自体は成功させる）
- `lineUserId` が null のユーザーはすべての通知処理をスキップ
- Cronエンドポイントは既存と同様 `Authorization: Bearer CRON_SECRET` で認証
