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
| `homework/new/actions.ts` | `createHomework` | 宿題作成。Zod バリデーション、teacherId 自動付与 |
| `homework/[id]/actions.ts` | `updateHomework` | 宿題編集（assigned/rejected のみ） |
| `homework/[id]/actions.ts` | `approveHomework` | 承認（先生のみ） |
| `homework/[id]/actions.ts` | `rejectHomework` | 差し戻し（先生のみ、フィードバック必須） |
| `homework/[id]/submit/actions.ts` | `submitHomework` | 提出（生徒のみ）。写真は Supabase Storage へアップロード |
| `homework/page.tsx` | `cancelSubmission` | 提出取り消し（生徒・submitted 状態のみ） |
| `homework/templates/actions.ts` | `createTemplate` | テンプレート作成 |
| `homework/templates/actions.ts` | `deleteTemplate` | テンプレート削除 |

#### 宿題一括承認
`src/app/(app)/homework/bulk-approve-section.tsx` の `BulkApproveSection` コンポーネントから呼び出し。

### 授業（Lesson）

| ファイル | Action | 概要 |
| --- | --- | --- |
| `calendar/actions.ts` | `createLesson` | 授業作成。hourlyRate/travelExpense/lessonLog を含む |
| `calendar/actions.ts` | `updateLesson` | 授業更新。online の場合 travelExpense を 0 に強制 |
| `calendar/actions.ts` | `deleteLesson` | 授業削除（先生のみ） |

### テスト予定（ExamEvent）

| ファイル | Action | 概要 |
| --- | --- | --- |
| `calendar/actions.ts` | `createExamEvent` | テスト日登録 |
| `calendar/actions.ts` | `deleteExamEvent` | テスト日削除 |

### 成績（GradeRecord）

| ファイル | Action | 概要 |
| --- | --- | --- |
| `grades/new/actions.ts` | `createGradeRecord` | 成績登録。数値データがあれば `plantGardenItem` も呼ぶ |
| `grades/[id]/actions.ts` | `deleteGradeRecord` | 成績削除 |

### 生徒（Student）

| ファイル | Action | 概要 |
| --- | --- | --- |
| `students/invite/actions.ts` | `createInvitation` | 招待トークン生成（7日有効） |
| `students/[id]/actions.ts` | `updateStudentGrade` | 学年変更 |
| `students/[id]/actions.ts` | `deleteStudent` | 生徒削除（関連データも cascade） |
| `students/[id]/actions.ts` | `resetPassword` | 生徒のパスワードリセット |

### 教材（Material）

| ファイル | Action | 概要 |
| --- | --- | --- |
| `students/[id]/materials/actions.ts` | `createMaterial` | 教材登録 |
| `students/[id]/materials/actions.ts` | `deleteMaterial` | 教材削除 |

### 科目タグ（Subject）

| ファイル | Action | 概要 |
| --- | --- | --- |
| `subjects/actions.ts` | `createSubject` | 科目タグ作成 |
| `subjects/actions.ts` | `deleteSubject` | 科目タグ削除 |

### 学習の森（Garden）

| ファイル | Action | 概要 |
| --- | --- | --- |
| `lib/garden.ts` | `plantGardenItem` | 植物をDBに追加。満開時は gardenGeneration をインクリメントしてリセット |

## Route Handlers

| パス | メソッド | 概要 |
| --- | --- | --- |
| `/api/auth/[...nextauth]` | GET/POST | NextAuth ハンドラ |
| `/api/cron/cleanup-homework` | GET | Vercel Cron（`Authorization: Bearer CRON_SECRET` で認証） |

## Supabase Storage

```typescript
// src/lib/supabase-storage.ts
// バケット: homework-photos（Public）
// パス: {teacherId}/{homeworkId}/{timestamp}.{ext}
uploadHomeworkPhoto(file: File, teacherId: string, homeworkId: string): Promise<string>
// → 公開 URL を返す。Homework.photoUrl に保存する
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
