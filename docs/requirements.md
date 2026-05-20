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

```
assigned ─► submitted ─► approved
    ▲              └────► rejected
    └─────────────────────────────
         (生徒が再提出で assigned に戻る)
```

- `submitted` にできるのは生徒本人かつ `assigned` or `rejected` 状態のみ
- `approved` / `rejected` にできるのは担当の先生のみ
- 先生が編集できるのは `assigned` or `rejected` 状態の宿題のみ

### 写真提出

- 生徒が提出時に宿題のページ写真を1枚添付できる（任意、5MB以内）
- 写真は Supabase Storage の `homework-photos` バケット（Public）へサーバーサイドでアップロード
- URL は `Homework.photoUrl` に保存
- アップロードヘルパー: `src/lib/supabase-storage.ts`

### テンプレート

- 先生が `HomeworkTemplate` を作成・削除
- 宿題作成時にテンプレートを選択すると title/description が自動入力される

## 授業（Lesson）管理

- 先生がカレンダーから登録：日時・生徒・オンライン/対面・所要時間・メモ（事前）・授業ログ（事後）
- 時給（hourlyRate）と交通費（travelExpense）を記録可能
- **オンライン授業は交通費を強制的に 0 に設定**（server action 側で `effectiveTravelExpense = type === "online" ? 0 : travelExpense`）
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

認証: すべてのCronエンドポイントで `Authorization: Bearer CRON_SECRET` が必須。
設定ファイル: `vercel.json`

| エンドポイント | スケジュール | 内容 |
| --- | --- | --- |
| `GET /api/cron/cleanup-homework` | 毎日 18:00 UTC（03:00 JST） | 古い宿題・招待トークンを削除 |
| `GET /api/cron/line-daily` | 毎日 23:00 UTC（08:00 JST翌日） | LINE 日次通知送信 |
| `GET /api/cron/line-monthly` | 毎月1日 00:00 UTC | LINE 月次通知送信 |
| `GET /api/cron/annual-cleanup` | 毎年4月1日 00:00 UTC（09:00 JST） | 前年度以前のデータを全削除 |

### cleanup-homework の対象

1. `status = "approved"` かつ `dueDate` から7日以上経過した宿題
2. 未使用かつ `expiresAt` から7日以上経過した招待トークン
3. 使用済みかつ `usedAt` から30日以上経過した招待トークン

### annual-cleanup の対象

- カットオフ: 実行年の前年4月1日（例: 2026年4月1日実行 → 2025年4月1日より前を削除）
- 削除対象モデル: `Lesson`（date）/ `GradeRecord`（date）/ `Homework`（dueDate）/ `ExamEvent`（date）
- 日本の学校年度（4月〜3月）に合わせて1年分のデータを保持する
