# 機能要件・ビジネスロジック

## 認証・認可

- NextAuth.js v5 でセッション管理
- ロール: `teacher`（先生）/ `student`（生徒）
- 全 Server Action・Route Handler でセッションを確認する
- 権限チェックは必ずサーバー側で行う。クライアント側のロール判定は UI 表示制御のみ

## 招待フロー

1. 先生が `/students/invite` で生徒名・メール・学年を入力 → 招待トークン生成（7日有効）
2. 生徒が招待リンクを開き、名前・メール・学年を確認後パスワードを設定してアカウント作成
3. ログイン済みの状態で招待リンクを開くと先にログアウトするよう促す
4. 検証: `usedAt` が null かつ `expiresAt` が未来であること必ず確認する

## 宿題管理

### ステータス遷移

```text
assigned ─► submitted ─► approved
    ▲              └────► rejected
    └─────────────────────────────
         (生徒が再提出で assigned に戻る)
```

- `submitted` にできるのは生徒本人かつ `assigned` or `rejected` 状態のみ
- `approved` / `rejected` にできるのは担当の先生のみ
- 先生が編集できるのは `assigned` or `rejected` 状態の宿題のみ

### 写真提出

- 生徒が提出時に宿題の**代表的なページを1枚だけ**撮影して添付できる
- **ブラウザ側で圧縮してからアップロード**（Canvas API・最大辺 1200px・JPEG 78%品質）。典型的な 5MB スマホ写真が 100〜300KB 程度に圧縮される
- 圧縮処理中はスピナーを表示し、完了まで提出ボタンを無効化
- 圧縮済みファイルを Supabase Storage の `homework-photos` バケット（Public）へサーバーサイドでアップロード
- URL は `Homework.photoUrl` に保存
- アップロードヘルパー: `src/lib/supabase-storage.ts`
- `requiresPhoto = true` の宿題は写真がないと提出ボタンが無効化される

### 写真提出必須オプション

- 先生が宿題作成時に「写真提出を必須にする」を設定できる（`Homework.requiresPhoto`）
- 生徒の提出フォームで必須バッジを表示し、写真なしでは提出不可

## 使用教材管理

- 先生が生徒ごとに使用教材（`StudentMaterial`）を登録
  - 教材名・メモ・科目タグ（複数選択）を設定
  - 登録後に科目タグをインライン編集可能
- 生徒は `/materials` で自分に登録された教材一覧を閲覧（参照のみ）
- 宿題作成時に教材を1つ紐づけられる

### 教材写真の先生への送信

**廃止済み（2026年5月）**。代替手段として Google Drive 等の共有リンクを使うことを推奨。

## 授業（Lesson）管理

- 先生がカレンダーから登録：日時・生徒・オンライン/対面・所要時間・メモ（事前）・授業ログ（事後）
- 時給（hourlyRate）と交通費（travelExpense）を記録可能
- **オンライン授業は交通費を強制的に 0 に設定**（server action 側で `effectiveTravelExpense = type === "online" ? 0 : travelExpense`）
- 週次繰り返し登録（最大52週）：QStash スケジューリングは try-catch で囲み、失敗しても授業は保存される
- 生徒は自分の授業のみ閲覧可（作成・削除不可）

### 授業前リマインダー・Meet 参加

- 先生が設定ページで Google Meet の固定 URL（パーソナルルーム）を登録（取得手順を UI 内に掲載）
- オンライン授業を登録すると、開始 10 分前に生徒の LINE へ Meet リンクを自動送信
- スケジューリングは Upstash QStash を使用（Vercel Hobby プランでも動作）
- 授業変更・削除時は QStash メッセージをキャンセルして再予約
- 先生の `meetLink` が未設定、または生徒が LINE 未連携の場合は LINE 通知をスキップ
- **カレンダーの授業カード**（先生・生徒とも）と**「次の授業」バナー**から Meet に直接参加できるボタンを表示
- 詳細: [docs/meet-reminder-plan.md](meet-reminder-plan.md)

### 授業完了フロー

1. 先生がカレンダーで授業日より前の、未完了授業に「完了」ボタンを押す
2. `completeLesson` Server Action が `completedAt` に現在時刻をセット
3. `completedAt != null` の授業のみ請求管理に反映される
4. 未完了授業がある場合、ダッシュボードとカレンダーに促しバナーを表示

カレンダー表示:

- 未完了（過去）: 青背景 + 「完了」ボタン表示
- 完了済み: 緑背景 + 「✓ 完了」バッジ
- 未来の授業: 青背景、完了ボタンなし

## 請求管理（Billing）

```typescript
// src/app/(app)/billing/page.tsx
function calcFee(durationMin, hourlyRate, travelExpense) {
  if (!hourlyRate && !travelExpense) return null
  const lessonFee = durationMin && hourlyRate
    ? Math.round((durationMin / 60) * hourlyRate)
    : 0
  return lessonFee + (travelExpense ?? 0)
}
```

- **`completedAt != null` の授業のみ集計対象**（未完了授業は除外）
- 月別ナビ（URL `?year=YYYY&month=MM`）
- 月の合計：完了授業回数・合計時間・合計金額
- 生徒別に授業一覧と費用内訳を表示
- 未完了授業がある月はオレンジ色の警告バナーを表示

## 科目タグ（Subject）管理

- 先生が `/settings` の「タグ管理」セクションで科目タグを追加・削除
- タグは宿題・成績・授業・教材に付与できる
- `@@unique([name, teacherId])` で同名タグの重複登録を防止

## 成績（GradeRecord）管理

- `testType`: mock / exam / quiz / other の4択
- 先生の成績一覧: URL `?type=mock` 等でサーバーサイドフィルタリング
- 生徒の成績グラフ: 複数種別が存在する場合のみ種別フィルタを表示（クライアントサイド）
- 点数と偏差値の切り替え表示（Recharts グラフ）
- 成績登録時に数値データがある場合、スコアに応じた植物が森に育つ

## 学習の森（Garden）

生徒の学習努力をアイソメトリックな森として可視化するゲーム要素。

### 植物が育つ条件

`src/lib/garden.ts` の `plantGardenItem` Server Action で制御。

| トリガー | 種別選択ロジック |
| --- | --- |
| 宿題承認 | ランダム選択（tree 38% / bush 29% / flower 28% / mushroom ≈5%） |
| 成績（点数）100% | bamboo（竹） |
| 成績（点数）90%+ | cherry（桜） |
| 成績（点数）80%+ | big_tree（大木） |
| 成績（点数）60-79% | bush（茂み） |
| 成績（点数）<60% | flower（花） |
| 成績（偏差値）70+ | bamboo |
| 成績（偏差値）65+ | cherry |
| 成績（偏差値）60+ | tree |
| 成績（偏差値）50-59 | bush |
| 成績（偏差値）<50 | flower |
| 数値データなし | 植わらない |

`src/lib/garden-utils.ts` の `scoreToGardenItemType()` で種別を決定。

### 枯れロジック（DB 変更なし・動的計算）

- 枯れ数 = `rejected` 件数 + 期限切れ `assigned` 件数
- 枯れ数だけ古い順に植物を「枯れ表示」（WiltedTree / WiltedBush / etc.）
- 生徒が提出（submitted）にすると即回復

### 宿題ステータスと森の連動

| 宿題の状態 | 森への影響 |
| --- | --- |
| approved | 植物が1つ育つ |
| rejected | 古い植物1つが枯れ（提出で回復） |
| assigned + 期限切れ | 古い植物1つが枯れ（提出で回復） |
| submitted | 影響なし |

### グリッド仕様

- 8×8 = 最大64アイテム、座標は `@@unique([studentId, x, y])`
- 満開（64個）到達で `gardenGeneration` がインクリメントされリセット

### アクセス

- 生徒: `/garden`（自分の森）
- 先生: `/students/[id]/garden`（担当生徒の森・閲覧のみ）

## テスト予定日（ExamEvent）

- 先生がカレンダーの日付をクリックして登録
- 生徒ダッシュボードの「直近のテスト」と「今後7日の期限」に反映

## 自動クリーンアップ（Vercel Cron）

認証: すべての Cron エンドポイントで `Authorization: Bearer {CRON_SECRET}` ヘッダーが必須（小文字 `authorization`）。
設定ファイル: `vercel.json`

| エンドポイント | スケジュール | 内容 |
| --- | --- | --- |
| `GET /api/cron/cleanup-homework` | 毎日 18:00 UTC（03:00 JST） | 古い宿題・招待トークンを削除 |
| `GET /api/cron/line-daily` | 毎週日曜 23:00 UTC（月曜 08:00 JST） | LINE 週次通知送信 |

> **注意**: Vercel Hobby プランは Cron を 2 本まで。`line-monthly` と `annual-cleanup` は削除済み。

### cleanup-homework の対象

1. `status = "approved"` かつ `dueDate` から7日以上経過した宿題
2. 未使用かつ `expiresAt` から7日以上経過した招待トークン
3. 使用済みかつ `usedAt` から **7日以上**経過した招待トークン

### 年次データクリーンアップ（手動実行）

annual-cleanup Cron は削除済み。必要な場合は Supabase SQL エディタで以下を実行する。

```sql
-- 実行前年度の4月1日以前のデータを削除（例: 2026年実行 → 2025-04-01 より前を削除）
DELETE FROM "Lesson"       WHERE date       < '2025-04-01';
DELETE FROM "GradeRecord"  WHERE date       < '2025-04-01';
DELETE FROM "Homework"     WHERE "dueDate"  < '2025-04-01';
DELETE FROM "ExamEvent"    WHERE date       < '2025-04-01';
```
