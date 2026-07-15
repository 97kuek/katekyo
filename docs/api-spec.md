# API・Server Actions 仕様

## 認証パターン

すべての Server Action・Route Handler で以下を実施する:

```typescript
const session = await auth()
if (!session) return { error: "認証が必要です" }
// ロールチェックが必要な場合
if (session.user.role !== "teacher") return { error: "権限がありません" }
```

**redirect vs return の使い分け:**
- フォーム送信系（`useActionState` で状態を受け取る）→ `return { error: "..." }`
- ボタン直接実行系（エラー表示が不要）→ 認証失敗時は `redirect("/dashboard")`

---

## Server Actions 一覧

### 認証（Authentication）

| ファイル | Action | ロール | 概要 |
| --- | --- | --- | --- |
| `(auth)/register/actions.ts` | `registerTeacher` | 未ログイン | 先生アカウントを作成する |
| `(auth)/invite/[token]/actions.ts` | `acceptInvite` | 未ログイン | 有効な生徒招待をトランザクションで受理する |

### 宿題（Homework）

#### `homework/new/actions.ts`

| Action | ロール | 概要 |
| --- | --- | --- |
| `createHomework` | teacher | 宿題作成 |

```typescript
// 入力（FormData）
{
  studentId: string (uuid)
  title: string (1–100文字)
  description?: string
  dueDate: string (datetime)
  subjectIds: string[] (getAll)
  materialId?: string (uuid)
  requiresPhoto?: "on"
}
// 返り値
{ error: string }  // 成功時 redirect("/homework")
```

#### `homework/[id]/actions.ts`

| Action | ロール | 概要 |
| --- | --- | --- |
| `submitHomework` | student | 宿題提出。写真は Supabase Storage へアップロード（最大 5MB） |
| `reviewHomework` | teacher | 承認 / 差し戻し。`HomeworkEvent` を記録。LINE 通知あり |
| `markFeedbackSeen` | student | フィードバック既読マーク（`feedbackSeenAt` をセット） |
| `cancelSubmission` | student | 提出取り消し（submitted 状態のみ）。`status → assigned` |
| `updateHomework` | teacher | 宿題編集（assigned / rejected 状態のみ） |
| `extendDueDate` | teacher | 期限延長 |
| `deleteHomework` | teacher | 宿題削除 |

```typescript
// submitHomework 入力
{
  id: string (uuid)
  note?: string
  difficultyRating?: 1 | 2 | 3
  photo?: File (image/*, max 5MB)
}
// 返り値: { error: string }  成功時 redirect("/homework?toast=submitted")

// reviewHomework 入力
{
  id: string (uuid)
  action: "approved" | "rejected"
  feedback?: string
}
// 返り値: { error: string }  成功時 redirect("/homework?toast=reviewed")

// extendDueDate 入力
{ id: string, dueDate: string }
// 返り値: { error: string; success: boolean }
```

#### `homework/actions.ts`

| Action | ロール | 概要 |
| --- | --- | --- |
| `bulkApproveHomework` | teacher | 複数宿題の一括承認。`HomeworkEvent(approved)` を `createMany` でまとめて記録。LINE 通知・GardenItem 付与も実行 |

```typescript
// 入力
bulkApproveHomework(ids: string[]): Promise<{ error: string; approved: number }>
```

---

### 授業（Lesson）

#### `calendar/actions.ts`

| Action | ロール | 概要 |
| --- | --- | --- |
| `createLesson` | teacher | 授業作成。週次繰り返し対応（最大52週分を一括 create）。online の場合 QStash でリマインダー予約 |
| `updateLesson` | teacher | 授業更新。online の場合 `travelExpense` を 0 に強制。QStash を再予約 |
| `deleteLesson` | teacher | 授業削除。QStash をキャンセル |
| `completeLesson` | teacher | 授業完了確定。`completedAt` に現在時刻をセット（未完了のみ） |
| `uncompleteLesson` | teacher | 授業完了取り消し（`completedAt → null`） |
| `createHomeworkFromCalendar` | teacher | カレンダー画面から直接宿題を作成 |
| `createExamEvent` | teacher | テスト日登録 |
| `deleteExamEvent` | teacher | テスト日削除 |

```typescript
// createLesson 入力（FormData）
{
  studentId: string (uuid)
  date: string ("YYYY-MM-DD")
  time: string ("HH:MM")
  type: "online" | "offline"
  durationMin?: string
  notes?: string
  hourlyRate?: number (int, min 0)
  travelExpense?: number (int, min 0)   # online の場合は 0 に強制
  subjectIds: string[] (getAll)
  repeatWeeks?: string   # "0"=繰り返しなし, "1"–"52"=週次繰り返し回数
}
// 返り値: { error: string; timestamp?: number }
// 成功時 timestamp を返し、クライアントで useEffect によりモーダルを閉じる
```

---

### 成績（GradeRecord）

#### `grades/new/actions.ts`

| Action | ロール | 概要 |
| --- | --- | --- |
| `createGradeRecord` | teacher | 成績登録。数値データがあれば `plantGardenItem` も呼ぶ |

#### `grades/[id]/actions.ts`

| Action | ロール | 概要 |
| --- | --- | --- |
| `updateGradeRecord` | teacher | 成績編集 |
| `deleteGradeRecord` | teacher | 成績削除。成功時 `redirect("/grades?toast=deleted")` |

```typescript
// updateGradeRecord 入力（FormData）
{
  id: string (uuid)
  testName: string (min 1)
  date: string
  testType: "mock" | "exam" | "quiz" | "other"
  subjectIds: string[] (getAll)
  score?: number (int)
  maxScore?: number (int)
  avgScore?: number (int)
  rank?: number (int)
  totalStudents?: number (int)
  deviation?: number (float)
  teacherRating?: number (int 1–5)
  comment?: string
}
// 返り値: { error: string }  成功時 redirect("/grades?toast=saved")
```

---

### 生徒（Student）

#### `students/invite/actions.ts`

| Action | ロール | 概要 |
| --- | --- | --- |
| `createInvite` | teacher | 招待トークン生成（7日有効） |

#### `students/invites/actions.ts`

| Action | ロール | 概要 |
| --- | --- | --- |
| `revokeInvite` | teacher | 招待トークン無効化（削除） |

#### `students/[id]/actions.ts`

| Action | ロール | 概要 |
| --- | --- | --- |
| `updateStudentGrade` | teacher | 学年変更 |

#### `students/actions.ts`

| Action | ロール | 概要 |
| --- | --- | --- |
| `resetStudentPassword` | teacher | 生徒のパスワードリセット（bcrypt コスト係数 12） |
| `updateStudentRates` | teacher | 授業デフォルト値（時給・交通費・時間・科目）の更新 |
| `deleteStudent` | teacher | 生徒削除。Supabase Storage の宿題写真を先に削除してから `db.user.delete`（DB は cascade） |

```typescript
// resetStudentPassword 入力
{ studentId: string, password: string (min 8文字) }
// 返り値: { error: string; success: boolean }

// updateStudentRates 入力（FormData）
{
  studentId: string
  defaultHourlyRate?: number (int, min 0)
  defaultTravelExpense?: number (int, min 0)
  defaultDurationHours?: number (min 0.5)    # 分ではなく時間単位で受け取り、分に変換
  defaultSubjectIds: string[] (getAll)
}
// 返り値: { error: string; success: boolean }
```

---

### 保護者（Parent）

#### `students/[id]/invite-parent/actions.ts`

| Action | ロール | 概要 |
| --- | --- | --- |
| `createParentInvite` | teacher | 保護者招待トークン生成（teacherId + studentId で作成、7日有効） |

#### `students/[id]/parents/actions.ts`

| Action | ロール | 概要 |
| --- | --- | --- |
| `unlinkParent` | teacher | 保護者と生徒のリンクを解除（teacherId 所有確認後に ParentStudent を削除） |

#### `(auth)/parent-invite/[token]/actions.ts`

| Action | ロール | 概要 |
| --- | --- | --- |
| `acceptParentInvite` | 未ログイン | トークン検証 → `User(role=parent)` 作成 + `ParentStudent` 作成をトランザクションで実行 → `/dashboard` へ |
| `linkExistingParent` | parent | ログイン済み保護者がトークンを踏んだ場合: `ParentStudent` レコードを追加するだけ |

#### `(app)/parent-invite/create/actions.ts`

| Action | ロール | 概要 |
| --- | --- | --- |
| `createParentInviteAsStudent` | student | 生徒が保護者招待リンクを生成（`studentProfile` から `teacherId` を取得して `ParentInviteToken` を作成） |

---

### 教材（StudentMaterial）

#### `students/[id]/materials/actions.ts`

| Action | ロール | 概要 |
| --- | --- | --- |
| `createMaterial` | teacher | 教材登録（名前・メモ・科目タグ） |
| `deleteMaterial` | teacher | 教材削除 |
| `updateMaterialSubjects` | teacher | 教材の科目タグをインライン編集 |

---

### 設定（Settings）

#### `settings/actions.ts`

| Action | ロール | 概要 |
| --- | --- | --- |
| `linkGoogleAccount` | 全ロール | 10分有効の連携intentを発行し、Google OAuthを開始。メール一致による自動統合はしない |
| `unlinkGoogleAccount` | 全ロール | 現在のプロフィールに対するGoogleアクセス権を解除し、監査ログを記録 |
| `generateLinkToken` | teacher / student | LINE 連携用CSPRNG 12桁hexトークン発行（10分有効） |
| `unlinkLine` | teacher / student | LINE 連携解除。リッチメニューを解除してから `lineUserId` を null に |
| `saveMeetLink` | teacher | Google Meet 固定 URL を保存（空文字で削除） |
| `deleteParentAccount` | parent | 保護者本人のアカウントと生徒との紐づきを削除 |

---

### プロフィール（Profile）

#### `profile/actions.ts`

| Action | ロール | 概要 |
| --- | --- | --- |
| `updateName` | 全ロール | 表示名変更 |
| `updatePassword` | 全ロール | パスワード変更（現在のパスワード確認あり） |

---

### 請求（Billing）

#### `billing/actions.ts`

| Action | ロール | 概要 |
| --- | --- | --- |
| `markAsPaid` | teacher | 月次支払いを入金済みに設定（`paidAt: new Date()`） |
| `markAsUnpaid` | teacher | 月次支払いを未払いに戻す。`dueDate` が設定されている場合は `paidAt: null` のみ変更、ない場合はレコード削除 |
| `setPaymentDueDate` | teacher | 支払い期限を設定・更新・クリア。空文字送信かつ未払いの場合はレコード削除 |

```typescript
// markAsPaid / markAsUnpaid / setPaymentDueDate 入力（FormData）
{
  studentId: string
  year: string (数値)
  month: string (数値)
  dueDate?: string ("YYYY-MM-DD" または空文字)  # setPaymentDueDate のみ
}
// 返り値: void（revalidatePath("/billing")）
```

---

### ダッシュボード（Dashboard）

#### `dashboard/actions.ts`

| Action | ロール | 概要 |
| --- | --- | --- |
| `markLessonLogSeen` | student | 授業ログを既読マーク（`lessonLogSeenAt: new Date()`）。revalidate しないのでクライアント側即時更新 |

```typescript
markLessonLogSeen(lessonId: string): Promise<void>
```

---

### 学習の森（Garden）

#### `lib/garden/actions.ts`

| Action | ロール | 概要 |
| --- | --- | --- |
| `plantGardenItem` | internal | 植物を DB に追加。グリッド満杯時は `gardenGeneration` をインクリメントして全アイテムをリセット |
| `plantForHomeworkApproval` | internal | 宿題承認時に呼ぶ。差し戻し歴の有無でアイテムランクを変える |

---

### 科目タグ（Subject）

#### `subjects/actions.ts`

| Action | ロール | 概要 |
| --- | --- | --- |
| `createSubject` | teacher | 科目タグ作成 |
| `deleteSubject` | teacher | 科目タグ削除 |
| `updateSubjectColor` | teacher | 科目タグの表示色を許可済みトークンから更新 |

---

### 利用規約（Terms）

#### `terms-actions.ts`

| Action | ロール | 概要 |
| --- | --- | --- |
| `agreeToTerms` | 全ロール | 利用規約への同意を記録（`agreedToTermsAt: new Date()`） |

---

### 表示切り替え（View as）

#### `view-as-actions.ts`

| Action | ロール | 概要 |
| --- | --- | --- |
| `startViewingAs` | teacher | 同一テナントの生徒を対象に閲覧コンテキストを開始 |
| `stopViewingAs` | teacher | 閲覧コンテキストを終了 |

---

## Route Handlers

| パス | メソッド | 認証 | 概要 |
| --- | --- | --- | --- |
| `/api/auth/[...nextauth]` | GET/POST | – | NextAuth ハンドラ |
| `/api/billing/export` | GET | teacher セッション | 請求 CSV エクスポート。`?year=&month=` で月指定。UTF-8 BOM 付き（Excel 対応）。列: 生徒名 / 日付 / 開始時刻 / 種別 / 所要時間 / 時給 / 交通費 / 授業料 / 合計 |
| `/api/cron/cleanup-homework` | GET | `CRON_SECRET` Header | Vercel Cron: 古い宿題・期限切れ招待トークン削除（毎日 18:00 UTC） |
| `/api/cron/annual-cleanup` | GET | `CRON_SECRET` Header | 手動実行: 保持期間を超えた年度データを削除 |
| `/api/cron/line-daily` | GET | `CRON_SECRET` Header | Vercel Cron: LINE 週次通知（毎週日曜 23:00 UTC） |
| `/api/cron/line-monthly` | GET | `CRON_SECRET` Header | 手動実行: 月次LINE通知（定期Cronは無効） |
| `/api/cron/lesson-reminder` | GET/POST | `CRON_SECRET` Bearer | 開始時刻が近いオンライン授業を検索する冪等セーフティネット |
| `/api/webhooks/lesson-reminder` | POST | QStash 署名検証 | オンライン授業 10 分前に生徒の LINE へ Meet リンクを送信 |
| `/api/line/webhook` | POST | LINE署名検証 | LINEイベントを受信し、連携トークンをユーザーへ紐づける |
| `/api/line/setup-rich-menus` | POST | `Authorization: Bearer CRON_SECRET` | 一回限り: LINE リッチメニュー作成（先生・生徒用） |
| `/api/line/apply-rich-menus` | POST | `Authorization: Bearer CRON_SECRET` | 一回限り: LINE 連携済み既存ユーザー全員にリッチメニューを一括適用 |
| `/api/qstash/setup-reminder-schedule` | POST | `Authorization: Bearer CRON_SECRET` | QStashに授業リマインダーの定期スケジュールを作成 |

---

## Supabase Storage

```typescript
// src/lib/supabase-storage.ts

// バケット: homework-photos（Private）
// パス: homework/{homeworkId}/{timestamp}.{ext}
uploadHomeworkPhoto(file: File, homeworkId: string): Promise<string | null>
// → private object path を返す。Homework.photoUrl に保存する

deleteHomeworkPhoto(url: string): Promise<void>
// → URL から Storage パスを解析して削除。生徒削除時・写真再アップ時に呼び出す
```

---

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

---

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
if (!parsed.success) return { error: parsed.error.issues[0].message }
```

---

## useActionState パターン

```typescript
// クライアントコンポーネント
const [state, action, isPending] = useActionState(serverAction, { error: "" })

// Server Action の返り値
return { error: "..." }                          // エラー時
return { error: "", timestamp: Date.now() }      // 成功時（useEffect でモーダルを閉じる等）
```

---

## テナント分離チェックリスト

Server Action を実装する際は以下の順序を必ず守る:

1. `await auth()` でセッション取得 → null なら即 return / redirect
2. ロールチェック（必要な場合）
3. Zod バリデーション
4. DB クエリに `teacherId: session.user.id`（先生）または `studentId: student.id`（生徒、要事前確認）を含める
5. `id` だけの `findFirst` は禁止

### エラー契約

- 認証・認可エラーで対象リソースの存在を漏らさない
- Zodエラーは利用者が修正できる簡潔なメッセージへ変換する
- DB更新と履歴作成を一体として扱う必要がある処理はtransactionを使う
- LINE・QStashなど副次的通知の失敗は `NFR-REL-01` に従い、主データ保存を不整合に戻さない
- WebhookとCronは未検証リクエストを処理せず、再送されても二重実行しない

```typescript
// ✅ 正しい実装例
export async function updateHomework(_prev: State, formData: FormData) {
  const session = await auth()
  if (!session || session.user.role !== "teacher") return { error: "権限がありません" }

  const parsed = schema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const existing = await db.homework.findFirst({
    where: { id: parsed.data.id, teacherId: session.user.id },  // ← テナント境界
  })
  if (!existing) return { error: "宿題が見つかりません" }

  await db.homework.update({ where: { id: parsed.data.id }, data: { ... } })
  redirect(`/homework/${parsed.data.id}`)
}
```
