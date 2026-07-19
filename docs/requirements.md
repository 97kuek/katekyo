# 機能要件・ビジネスロジック

ユーザー視点の利用シナリオは [docs/usecases.md](usecases.md) を参照。  
このドキュメントは実装上のルール・制約・ビジネスロジックを記述する。

## 要件カタログ

詳細節では、次のIDを変更・テスト・レビュー時の参照単位として使う。受入条件の細分化は、この親IDを維持したまま連番を追加する。

| ID | 分類 | 要件 | 主なユースケース |
| --- | --- | --- | --- |
| NFR-SEC-01 | Security | 先生単位のテナントを越えてデータを参照・変更できない | 全UC |
| NFR-SEC-02 | Security | サーバー側で認証、ロール、対象リソースの権限を検証する | 全UC |
| FR-INV-01 | Functional | 先生が期限付きトークンで生徒を招待できる | UC-01 |
| FR-INV-02 | Functional | 先生または生徒が保護者を招待できる | UC-02 |
| BR-INV-01 | Business rule | 招待トークンは期限切れまたは使用済みなら受理しない | UC-01、UC-02 |
| FR-HW-01 | Functional | 先生が担当生徒へ宿題を作成・編集できる | UC-03 |
| FR-HW-02 | Functional | 生徒が自分の宿題を提出・取り消し・再提出できる | UC-04 |
| FR-HW-03 | Functional | 先生が提出済み宿題を承認・差し戻しできる | UC-05、UC-06 |
| BR-HW-01 | Business rule | 宿題は定義された状態遷移だけを許可する | UC-03〜UC-06 |
| FR-LSN-01 | Functional | 先生が担当生徒の授業とテスト予定を管理できる | UC-07、UC-13 |
| BR-LSN-01 | Business rule | 完了済み授業だけを請求対象にする | UC-08、UC-09 |
| FR-BIL-01 | Functional | 先生が月次請求、期限、入金状態を管理できる | UC-09 |
| BR-BIL-01 | Business rule | 授業料と交通費を定義された計算式で算出する | UC-08、UC-09 |
| FR-GRD-01 | Functional | 先生が成績を管理し、許可された利用者が推移を閲覧できる | UC-10、UC-11 |
| FR-GDN-01 | Functional | 宿題承認に応じたGardenを表示する | UC-05、UC-12 |
| BR-GDN-01 | Business rule | Gardenの付与・枯れ表示・世代更新を決定論的な規則で処理する | UC-12 |
| FR-NTF-01 | Functional | 利用者がLINEを連携し、対象イベントの通知を受け取れる | UC-14 |
| FR-NTF-02 | Functional | 条件を満たすオンライン授業の開始前にMeetリンクを通知する | UC-15 |
| NFR-REL-01 | Reliability | 外部通知の失敗で主データの保存を不整合にしない | UC-03〜UC-08、UC-15 |
| NFR-SEC-03 | Security | 提出写真は認可済み利用者だけが短時間アクセスできる | UC-04、UC-05 |
| NFR-SEC-04 | Security | 管理APIは秘密値未設定時にfail closedし、正しいBearerだけを受理する | 運用 |

IDと実装・図・テストの対応は [traceability.md](traceability.md) を参照する。

---

## 認証・認可

### ロールと権限

| ロール | できること | できないこと |
|---|---|---|
| `teacher` | 全データの CRUD、生徒招待、請求管理 | 他テナントへのアクセス |
| `student` | 自分の宿題提出・閲覧、成績・授業・森の閲覧 | 授業の作成・削除、他生徒データへのアクセス |
| `parent` | 担当生徒の全データ閲覧のみ | 書き込み操作全般 |

- 認証: NextAuth.js v5（Credentials プロバイダー、bcrypt コスト係数 12）
- セッション確認はすべての Server Action・Route Handler でサーバー側で行う
- **クライアント側のロール判定は UI 表示制御のみ**（認可はサーバー側が唯一の砦）

### 保護者のアクセス制御

`src/proxy.ts` の保護者向けホワイトリストで以下のパスのみ許可:

```
/dashboard, /grades, /calendar, /billing, /settings, /help,
/parent-invite, /homework, /garden
```

### テナント分離

- `NFR-SEC-01`: 先生の操作では、すべてのテナントデータの DB クエリに `teacherId: session.user.id` を含める（詳細は [data-models.md](data-models.md)）
- 生徒の操作ではセッションの `studentId`、保護者の閲覧では `ParentStudent` の紐づきを権限境界にする
- `id` のみを条件とする `findFirst` は禁止
- `subjectIds` / `defaultSubjectIds` は保存前に、全IDが同じ `teacherId` の科目であることを検証する

---

## 招待フロー

### 生徒招待

1. 先生が生徒名・学年を入力 → `InviteToken` を生成（7日有効、UUID トークン）
2. 生徒が招待リンクを開き、メールアドレス・パスワードを設定して `User(role=student)` + `Student` を作成
3. ログイン済みの状態で招待リンクを開いた場合はログアウトを促す

**検証ルール:** `usedAt = null` かつ `expiresAt > 現在時刻` であることを確認する。

### 保護者招待

1. 先生 または 生徒が `ParentInviteToken` を発行（7日有効）
2. 保護者がリンクを開く:
   - **未登録 →** `acceptParentInvite`: `User(role=parent)` 作成 + `ParentStudent` 作成をトランザクションで実行
   - **登録済み →** `linkExistingParent`: `ParentStudent` レコードを追加するだけ
3. 完了後 `/dashboard` へリダイレクト

---

## 宿題管理

### ステータス遷移

`BR-HW-01` として、次の遷移だけを許可する。
機械可読な設計図は [宿題状態遷移図](diagrams/state-homework.puml) を参照する。

```
assigned ──[生徒が提出]──▶ submitted ──[先生が承認]──▶ approved
    ▲                          │
    │                     [先生が差し戻し]
    │                          ▼
    └──[生徒が提出取り消し]── rejected
```

| 操作 | 実行者 | 条件 |
|---|---|---|
| `submitted` にする | 生徒のみ | `status=assigned` or `status=rejected` |
| `approved` / `rejected` にする | 先生のみ | `status=submitted` |
| 提出取り消し（`assigned` に戻す） | 生徒のみ | `status=submitted` |
| 編集 | 先生のみ | `status=assigned` or `status=rejected` |

### 写真提出

- 生徒が提出時にノートの写真（代表ページ1枚）を添付できる
- **ブラウザ上で圧縮してからアップロード**（Canvas API・最大辺 1200px・JPEG 78%品質）
  - 典型的な 5MB スマホ写真 → 100〜300KB 程度に圧縮
- 圧縮処理中はスピナー表示、完了まで提出ボタンを無効化
- Supabase Storage のPrivate `homework-photos` バケットへサーバーサイドでアップロード
- DBにはobject pathを保存し、認可済み詳細・レビュー画面で5分間有効な署名URLを生成する
- JPEG / PNG / WebPのmagic bytesを検証し、SVGやMIME偽装を拒否する
- `requiresPhoto = true` の宿題は写真がないと提出ボタンが無効化

### フィードバック既読管理

- 先生が `reviewHomework` を実行すると `Homework.feedbackSeenAt` を `null` にリセット
- 生徒が詳細ページを開くと `markFeedbackSeen` で `feedbackSeenAt = 現在時刻` をセット
- ダッシュボードの未読バッジ表示に使用

---

## 授業（Lesson）管理

### 作成・更新ルール

- **オンライン授業は交通費を強制的に 0** に設定（Server Action 内で `travelExpense = type === "online" ? 0 : travelExpense`）
- 週次繰り返し登録: 最大52週まで一括作成
- QStash スケジューリングは `try-catch` で囲み、失敗しても授業レコードは保存する

### 完了フロー

- `completeLesson` で `completedAt = 現在時刻` をセット
- **`completedAt != null` の授業のみ請求対象**
- 未完了の過去授業がある場合、ダッシュボードとカレンダーにオレンジバナーで促す

### カレンダー表示の色分け

| 状態 | 色 |
|---|---|
| 未来の授業 | 青背景 |
| 過去・未完了 | 青背景 + 「完了」ボタン |
| 完了済み | 緑背景 + 「✓ 完了」バッジ |

### 授業前リマインダー

- オンライン授業登録時に Upstash QStash で授業開始10分前のリマインダーをスケジュール
- 先生の `meetLink` が未設定、または生徒が LINE 未連携の場合は通知をスキップ
- 授業変更・削除時は `cancelReminderMessage` で既存メッセージをキャンセル後に再スケジュール
- `Lesson.reminderSentAt` で Cron と QStash の二重送信を防止
- 詳細: [docs/meet-reminder-plan.md](meet-reminder-plan.md)

---

## 請求管理（Billing）

### 授業料の計算式

```typescript
function calcFee(durationMin, hourlyRate, travelExpense) {
  if (!hourlyRate && !travelExpense) return null
  const lessonFee = durationMin && hourlyRate
    ? Math.round((durationMin / 60) * hourlyRate)
    : 0
  return lessonFee + (travelExpense ?? 0)
}
```

- 時給・交通費が両方とも未設定の場合は金額を表示しない（`null`）
- **`completedAt != null` の授業のみ集計対象**

### 支払いステータス管理

| 状態 | 条件 |
|---|---|
| 未払い | `MonthlyPayment` レコードなし or `paidAt = null` |
| 入金済み | `paidAt != null` |
| 期限設定あり | `dueDate != null` |

**`markAsUnpaid` の挙動:**
- `dueDate` が設定されている → `paidAt = null` にリセット（レコード保持）
- `dueDate` が未設定 → レコードを削除

**`setPaymentDueDate` で空文字を送信した場合（期限クリア）:**
- 未払いの場合 → レコードを削除
- 入金済みの場合 → `dueDate = null` に更新（`paidAt` は保持）

### CSV エクスポート

`GET /api/billing/export?year=YYYY&month=MM`

- UTF-8 BOM 付き（Excel で文字化けしない）
- 列: 生徒名 / 日付 / 開始時刻 / 種別 / 所要時間 / 時給 / 交通費 / 授業料 / 合計

---

## 科目タグ（Subject）管理

- 先生が `/settings` の「タグ管理」セクションで追加・削除
- タグは宿題・成績・授業・教材に複数付与できる
- `@@unique([name, teacherId])` で同一テナント内の重複登録を防止
- `Homework.subjectIds`・`Lesson.subjectIds` 等は `Subject.id` の UUID 配列（PostgreSQL `TEXT[]`）として格納

---

## 成績（GradeRecord）管理

### 種別

`TestType`: `mock`（模試）/ `exam`（定期テスト）/ `quiz`（小テスト）/ `other`（その他）

### 表示

- **先生の成績一覧:** `?type=mock` 等でサーバーサイドフィルタリング
- **生徒の成績グラフ:** 複数種別が存在する場合のみ種別フィルタを表示（クライアントサイド）
- **折れ線グラフ:** 点数（%）と偏差値の切り替え（Recharts `LineChart`）
- **レーダーチャート:** 同じテスト名でグループ化し、科目を軸に得点%（なければ偏差値）を表示。科目3つ以上のテストのみ対象

### 廃止済み

- **主観評価（`teacherRating`）**: UI 非使用・廃止済み。DB 列は残存

### 入力整合性

- 得点と満点はセット。`0 <= score <= maxScore <= 10000`
- 平均点を入力する場合は満点も必須。`0 <= avgScore <= maxScore`
- 順位と受験者数はセット。`1 <= rank <= totalStudents <= 1000000`
- 偏差値は `0..100`、コメントは2000文字以内
- 満点のない得点を割合やグラフ値として扱わない

---

## 学習の森（Garden）

### 植物が育つ条件

| トリガー | アイテム |
|---|---|
| 宿題承認（通常） | ランダム: tree 38% / bush 29% / flower 28% / mushroom ≈5% |
| 宿題承認（5回ごと） | `big_tree`（固定） |
| 成績 得点率 100% | `bamboo` |
| 成績 得点率 90%+ | `cherry` |
| 成績 得点率 80%+ | `tree` |
| 成績 得点率 60–79% | `bush` |
| 成績 得点率 60% 未満 | `flower` |
| 成績 偏差値 70+ | `bamboo` |
| 成績 偏差値 65+ | `cherry` |
| 成績 偏差値 60+ | `tree` |
| 成績 偏差値 50–59 | `bush` |
| 成績 偏差値 50 未満 | `flower` |
| 数値データなし | 植わらない |

評価軸はテスト種別で決める。模試は偏差値を優先し、定期テスト・小テスト・その他は得点率を優先する。優先値がない場合だけもう一方へフォールバックする。

成績由来の `GardenItem.sourceGradeId` は成績と1:1で、成績編集時は植物種別を再評価し、成績削除時は対応する植物も削除する。

移行前の成績は既存植物との対応を復元できないため `gardenEvaluationVersion=0` のまま保持し、編集時も植物を追加しない。新規成績はversion 1として追跡する。森の世代リセットで植物を収穫した成績はversion 2とし、後日の編集で再付与しない。
差し戻し歴がある宿題を承認した場合は植物が育たない（`plantForHomeworkApproval`）。  
遅延提出（`submittedAt > dueDate`）の宿題を承認した場合も植物が育たない。

### 枯れロジック（DB 変更なし・描画時に動的計算）

- 枯れ数 = `rejected` 件数 + 期限切れ `assigned` 件数
- 枯れ数だけ古い順に植物を「枯れ表示」（WiltedTree 等）
- 提出（`submitted`）にすると即回復

### グリッド仕様

- 8×8 = 最大64アイテム
- `@@unique([studentId, x, y])` で同座標への重複配置を防止
- 64個で満杯 → `gardenGeneration` をインクリメントし全アイテムを削除してリセット

---

## 使用教材（StudentMaterial）管理

- 先生が生徒ごとに教材を登録（教材名・メモ・科目タグ）
- 生徒は `/materials` で閲覧のみ
- 宿題作成時に教材を1つ紐づけられる（`Homework.materialId`）
- 教材の科目タグはインライン編集可能

---

## LINE 通知

### 通知タイミング

| イベント | 宛先 |
|---|---|
| 宿題提出 | 先生 |
| 宿題承認 | 生徒 |
| 宿題差し戻し + フィードバック | 生徒 |
| 毎週日曜（週次リマインド） | 未提出・期限切れ宿題がある生徒 |
| 授業開始10分前（Meet リンク） | 生徒 |

- `lineUserId = null` のユーザーはすべてスキップ（`sendLineMessage` が内部でチェック）
- 詳細: [docs/line-notification-plan.md](line-notification-plan.md)

---

## 自動クリーンアップ（Vercel Cron）

認証: `Authorization: Bearer {CRON_SECRET}` ヘッダーが必須。  
設定ファイル: `vercel.json`

| エンドポイント | スケジュール | 処理内容 |
|---|---|---|
| `GET /api/cron/cleanup-homework` | 毎日 18:00 UTC | 承認済み宿題（`dueDate` から7日超過）・期限切れ招待トークンを削除 |
| `GET /api/cron/line-daily` | 毎週日曜 23:00 UTC | 未提出・期限切れ宿題がある生徒に LINE 週次リマインド送信 |

> **注意:** Vercel Hobby プランは Cron が2本まで。`line-monthly` と `annual-cleanup` Cron は無効化済み。

### cleanup-homework の削除対象

1. `status=approved` かつ `dueDate` から7日以上経過した宿題
2. 未使用（`usedAt=null`）かつ `expiresAt` から7日以上経過した `InviteToken`
3. 使用済み（`usedAt!=null`）かつ `usedAt` から7日以上経過した `InviteToken`

### 年次データクリーンアップ（手動実行）

毎年4月ごろ、Supabase ダッシュボードの SQL Editor で実行:

```sql
DO $$
DECLARE
  cutoff TIMESTAMP := (DATE_TRUNC('year', NOW()) - INTERVAL '1 year' + INTERVAL '3 months');
BEGIN
  DELETE FROM "Lesson"      WHERE date < cutoff;
  DELETE FROM "GradeRecord" WHERE date < cutoff;
  DELETE FROM "Homework"    WHERE "dueDate" < cutoff;
  DELETE FROM "ExamEvent"   WHERE date < cutoff;
END $$;
```

> **注意:** 実行前に `SELECT COUNT(*)` で件数を確認してから削除すること。
