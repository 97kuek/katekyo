# API・Server Actions 仕様

## 認証パターン

すべての Server Action・Route Handler で以下を実施する:

```typescript
const session = await auth()
if (!session) return { error: "認証が必要です" }
// ロールチェックが必要な場合
if (session.user.role !== "teacher") return { error: "権限がありません" }
```

## Server Actions 一覧

### 宿題（Homework）

| ファイル | Action | 概要 |
| --- | --- | --- |
| `homework/new/actions.ts` | `createHomework` | 宿題作成。`requiresPhoto` フラグ対応。Zod バリデーション、teacherId 自動付与 |
| `homework/[id]/actions.ts` | `submitHomework` | 提出（生徒のみ）。写真は Supabase Storage へアップロード。`HomeworkEvent(submitted)` を記録 |
| `homework/[id]/actions.ts` | `reviewHomework` | 承認 / 差し戻し（先生のみ）。`action: "approved" \| "rejected"` で切り替え。`HomeworkEvent` を記録（差し戻し時のみ note あり） |
| `homework/[id]/edit-actions.ts` | `updateHomework` | 宿題編集（assigned/rejected のみ） |
| `homework/[id]/edit-actions.ts` | `extendDueDate` | 期限延長（先生のみ） |
| `homework/[id]/edit-actions.ts` | `deleteHomework` | 宿題削除（先生のみ） |
| `homework/[id]/cancel-actions.ts` | `cancelSubmission` | 提出取り消し（生徒・submitted 状態のみ） |
| `homework/bulk-actions.ts` | `bulkApproveHomework` | 複数宿題の一括承認（先生のみ） |

### 授業（Lesson）

| ファイル | Action | 概要 |
| --- | --- | --- |
| `calendar/actions.ts` | `createLesson` | 授業作成。週次繰り返し対応（最大52週）。QStash スケジューリングは try-catch で囲む |
| `calendar/actions.ts` | `updateLesson` | 授業更新。online の場合 travelExpense を 0 に強制。QStash を再予約 |
| `calendar/actions.ts` | `deleteLesson` | 授業削除（先生のみ）。QStash をキャンセル |
| `calendar/actions.ts` | `completeLesson` | 授業完了確定。`completedAt` に現在時刻をセット（先生のみ・未完了のみ） |
| `calendar/actions.ts` | `uncompleteLesson` | 授業完了取り消し |
| `calendar/actions.ts` | `createHomeworkFromCalendar` | カレンダー画面から直接宿題を作成（先生のみ） |

### 設定（Settings）

| ファイル | Action | 概要 |
| --- | --- | --- |
| `settings/actions.ts` | `generateLinkToken` | LINE 連携用 6 桁トークン発行（10 分有効） |
| `settings/actions.ts` | `unlinkLine` | LINE 連携解除。リッチメニューを解除してから `lineUserId` を null に |
| `settings/actions.ts` | `saveMeetLink` | Google Meet 固定 URL を保存（先生のみ。空文字で削除） |

### テスト予定（ExamEvent）

| ファイル | Action | 概要 |
| --- | --- | --- |
| `calendar/actions.ts` | `createExamEvent` | テスト日登録 |
| `calendar/actions.ts` | `deleteExamEvent` | テスト日削除 |

### 成績（GradeRecord）

| ファイル | Action | 概要 |
| --- | --- | --- |
| `grades/new/actions.ts` | `createGradeRecord` | 成績登録。数値データがあれば `plantGardenItem` も呼ぶ |
| `grades/[id]/edit-actions.ts` | `updateGradeRecord` | 成績編集 |
| `grades/[id]/edit-actions.ts` | `deleteGradeRecord` | 成績削除 |

### 生徒（Student）

| ファイル | Action | 概要 |
| --- | --- | --- |
| `students/invite/actions.ts` | `createInvite` | 招待トークン生成（7日有効） |
| `students/invites/actions.ts` | `revokeInvite` | 招待トークン無効化（削除） |
| `students/[id]/actions.ts` | `updateStudentGrade` | 学年変更 |
| `students/actions.ts` | `resetStudentPassword` | 生徒のパスワードリセット |
| `students/actions.ts` | `updateStudentRates` | 授業デフォルト値（時給・交通費・時間・科目）の更新 |
| `students/actions.ts` | `deleteStudent` | 生徒削除。Supabase Storage の宿題写真を先に削除してから `db.user.delete`（DB は cascade） |

### 保護者（Parent）

| ファイル | Action | 概要 |
| --- | --- | --- |
| `students/[id]/invite-parent/actions.ts` | `createParentInvite` | 先生が保護者招待トークンを生成（teacherId + studentId で作成、7日有効） |
| `students/[id]/parents/actions.ts` | `unlinkParent` | 保護者と生徒のリンクを解除（teacherId 所有確認後に ParentStudent を削除） |
| `(auth)/parent-invite/[token]/actions.ts` | `acceptParentInvite` | トークン検証 → User(role: parent)作成 + ParentStudent作成 をトランザクションで実行 → `/dashboard` へ |
| `(auth)/parent-invite/[token]/actions.ts` | `linkExistingParent` | ログイン済み保護者がトークンを踏んだ場合: ParentStudent レコードを追加するだけ |
| `(app)/parent-invite/create/actions.ts` | `createParentInviteAsStudent` | 生徒が保護者招待リンクを生成（studentProfile から teacherId を取得して ParentInviteToken を作成） |

### 教材（StudentMaterial）

| ファイル | Action | 概要 |
| --- | --- | --- |
| `students/[id]/materials/actions.ts` | `createMaterial` | 教材登録（名前・メモ・科目タグ） |
| `students/[id]/materials/actions.ts` | `deleteMaterial` | 教材削除 |
| `students/[id]/materials/actions.ts` | `updateMaterialSubjects` | 教材の科目タグをインライン編集 |

### プロフィール（Profile）

| ファイル | Action | 概要 |
| --- | --- | --- |
| `profile/actions.ts` | `updateName` | 表示名変更（両ロール共通） |
| `profile/actions.ts` | `updatePassword` | パスワード変更（現在のパスワード確認あり） |

### 請求（Billing）

| ファイル | Action | 概要 |
| --- | --- | --- |
| `billing/actions.ts` | `markAsPaid` | 月次支払いを入金済みに設定（先生のみ）。`paidAt: new Date()` をセット |
| `billing/actions.ts` | `markAsUnpaid` | 月次支払いを未払いに戻す（先生のみ）。`dueDate` が設定されている場合は `paidAt: null` のみ変更、ない場合はレコード削除 |
| `billing/actions.ts` | `setPaymentDueDate` | 支払い期限を設定・更新・クリア（先生のみ）。`dueDate` フォームフィールドが空の場合は期限をクリア（未払い時はレコード削除） |

### 利用規約（Terms）

| ファイル | Action | 概要 |
| --- | --- | --- |
| `terms-actions.ts` | `agreeToTerms` | 利用規約への同意を記録（`agreedToTermsAt` に現在時刻をセット） |

### 科目タグ（Subject）

| ファイル | Action | 概要 |
| --- | --- | --- |
| `subjects/actions.ts` | `createSubject` | 科目タグ作成（設定ページから呼び出し） |
| `subjects/actions.ts` | `deleteSubject` | 科目タグ削除（設定ページから呼び出し） |

### 学習の森（Garden）

| ファイル | Action | 概要 |
| --- | --- | --- |
| `lib/garden.ts` | `plantGardenItem` | 植物をDBに追加。満開時は gardenGeneration をインクリメントしてリセット |

## Route Handlers

| パス | メソッド | 概要 |
| --- | --- | --- |
| `/api/auth/[...nextauth]` | GET/POST | NextAuth ハンドラ |
| `/api/billing/export` | GET | 請求CSVエクスポート（先生のみ）。`?year=&month=` で月指定。UTF-8 BOM付きでExcel対応。列: 生徒名/日付/開始時刻/種別/所要時間/時給/交通費/授業料/合計 |
| `/api/cron/cleanup-homework` | GET | Vercel Cron: 古い宿題・招待トークン削除（毎日 18:00 UTC） |
| `/api/cron/line-daily` | GET | Vercel Cron: LINE 週次通知（毎週日曜 23:00 UTC） |
| `/api/webhooks/lesson-reminder` | POST | QStash Webhook: オンライン授業 10 分前に生徒の LINE へ Meet リンクを送信。署名検証あり |
| `/api/line/setup-rich-menus` | POST | 一回限り: LINE リッチメニュー作成（先生・生徒用）。`Authorization: Bearer CRON_SECRET` 必須 |
| `/api/line/apply-rich-menus` | POST | 一回限り: LINE 連携済み既存ユーザー全員にリッチメニューを一括適用。`Authorization: Bearer CRON_SECRET` 必須 |

## Supabase Storage

```typescript
// src/lib/supabase-storage.ts

// バケット: homework-photos（Public）
// パス: homework/{homeworkId}/{timestamp}.{ext}
uploadHomeworkPhoto(file: File, homeworkId: string): Promise<string | null>
// → 公開 URL を返す。Homework.photoUrl に保存する

deleteHomeworkPhoto(url: string): Promise<void>
// → URL から Storage パスを解析して削除。生徒削除時に呼び出す
```

## lib/line.ts — LINE ヘルパー関数

```typescript
// src/lib/line.ts

sendLineMessage(lineUserId: string, text: string): Promise<void>
// fire-and-forget。lineUserId が null のユーザーはスキップ

linkRichMenuToUser(lineUserId: string, richMenuId: string): Promise<void>
// LINE 連携完了時・一括適用時に呼び出す

unlinkRichMenuFromUser(lineUserId: string): Promise<void>
// LINE 連携解除時に呼び出す
```

## Zod バリデーション規則

すべての Server Action でリクエストを Zod スキーマでバリデーションする。

```typescript
// 典型的なパターン
const schema = z.object({
  title: z.string().min(1).max(100),
  dueDate: z.string().datetime(),
  studentId: z.string().uuid(),
})
const parsed = schema.safeParse(Object.fromEntries(formData))
if (!parsed.success) return { error: "入力が正しくありません" }
```

## useActionState パターン

```typescript
// クライアントコンポーネント
const [state, action, isPending] = useActionState(serverAction, { error: "" })

// Server Action の返り値
return { error: "..." }        // エラー時
return { error: "", timestamp: Date.now() }  // 成功時（useEffect でモーダルを閉じる等）
```
