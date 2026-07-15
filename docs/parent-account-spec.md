# 保護者アカウント設計

> **文書状態**: Supporting。現行要件は [requirements.md](requirements.md)、利用シナリオは [usecases.md](usecases.md)、データ構造は [data-models.md](data-models.md) を正本とする。

## 概要

家庭教師と生徒に加え、**保護者**が自分の子供の学習状況を閲覧専用で確認できる機能。  
1 保護者 = 複数生徒対応。招待は先生・生徒どちらからも可能。操作は閲覧のみ。

---

## 1. DB スキーマ変更

### 1-1. Role enum に `parent` を追加

```prisma
enum Role {
  teacher
  student
  parent   // 追加
}
```

### 1-2. ParentStudent（中間テーブル）追加

保護者と生徒の多対多リレーション。`teacherId` はテナント分離用。

```prisma
model ParentStudent {
  id        String   @id @default(uuid())
  parentId  String
  studentId String
  teacherId String
  createdAt DateTime @default(now())

  parent  User    @relation("ParentLinks", fields: [parentId], references: [id], onDelete: Cascade)
  student Student @relation(fields: [studentId], references: [id], onDelete: Cascade)
  teacher User    @relation("TeacherParentLinks", fields: [teacherId], references: [id])

  @@unique([parentId, studentId])
  @@index([parentId])
  @@index([studentId])
  @@index([teacherId])
}
```

### 1-3. ParentInviteToken 追加

生徒招待の `InviteToken` とは構造が異なる（`studentId` を持つ）ため別テーブル。

```prisma
model ParentInviteToken {
  id        String    @id @default(uuid())
  token     String    @unique @default(uuid())
  teacherId String
  studentId String
  email     String?
  usedAt    DateTime?
  expiresAt DateTime
  createdAt DateTime  @default(now())

  teacher User    @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  student Student @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([studentId])
  @@index([teacherId])
}
```

### 1-4. User・Student モデルへのリレーション追加

```prisma
// User に追加
parentLinks     ParentStudent[]  @relation("ParentLinks")
teacherParentLinks ParentStudent[] @relation("TeacherParentLinks")
parentInviteTokens ParentInviteToken[]

// Student に追加
parentLinks ParentStudent[]
```

---

## 2. 招待フロー

### 2-1. 先生から招待（`/students/[studentId]/invite-parent`）

1. 先生が生徒の詳細ページから「保護者を招待」をクリック
2. 保護者名・メアド（任意）を入力して送信
3. Server Action: `teacherId` + `studentId` で `ParentInviteToken` を作成（7日有効）
4. 招待 URL（`/parent-invite/[token]`）を表示・コピー

### 2-2. 生徒から招待（生徒ダッシュボードに追加）

1. 生徒ダッシュボードに「保護者を招待する」リンク
2. `/parent-invite/create` ページでメアドを入力
3. Server Action: `studentProfile` から `teacherId` を取得し `ParentInviteToken` を作成
4. URL をコピー

---

## 3. 保護者登録フロー（`/parent-invite/[token]`）

1. トークンを検証（存在・未使用・有効期限）
2. 登録フォームを表示（名前・メアド・パスワード）
3. Server Action:
   - `User` を作成（`role: parent`）
   - `ParentStudent` を作成（`parentId` + `studentId` + `teacherId`）
   - `ParentInviteToken.usedAt` を更新
   - セッション開始 → `/dashboard` へリダイレクト

既にアカウントを持つメアドの場合 → ログインさせて既存アカウントに `ParentStudent` を追加。

---

## 4. 保護者のページ構成

### 4-1. 生徒選択コンテキスト

複数生徒に対応するため、**URL パラメータ `?studentId=`** で閲覧する生徒を切り替える。  
デフォルトは最初の担当生徒（1 人の場合は自動選択）。

サイドバーまたはページ上部に **生徒セレクター**（`<select>`）を配置。

### 4-2. ページ一覧

| パス | 内容 |
| --- | --- |
| `/dashboard` | 担当生徒の一覧（複数の場合）または単一生徒のサマリー |
| `/grades?studentId=xxx` | 成績一覧・グラフ（閲覧のみ） |
| `/calendar?studentId=xxx` | 授業スケジュール・宿題締め切り（閲覧のみ） |
| `/billing?studentId=xxx` | 月次請求一覧（閲覧のみ） |

宿題の詳細・教材・学習の森は初期スコープ外（必要なら後から追加）。

### 4-3. 保護者ダッシュボード

担当生徒が 1 人の場合:
- 宿題進捗ゲージ
- 直近の授業ログ（公開分）
- 次回授業日
- 直近の成績記録

担当生徒が複数の場合:
- 生徒カード一覧（各カードに上記サマリー）

---

## 5. サイドバー

保護者ロール用のナビゲーション（読み取り専用ページのみ）。

```
[生徒セレクター]  ← 複数生徒時に表示

- ダッシュボード
- 成績
- カレンダー
- 請求
```

`src/components/sidebar.tsx` の `role === "parent"` ブランチで分岐。

---

## 6. セキュリティ原則

| ルール | 内容 |
| --- | --- |
| 閲覧可能生徒の検証 | 全クエリで `ParentStudent` を通じて `studentId` が自分の子供か確認 |
| 書き込み禁止 | Server Action で `role !== "parent"` を確認（または parent 専用 Action は作らない） |
| teacherId の取得 | `ParentStudent.teacherId` 経由で取得（保護者が直接 teacherId を指定しない） |
| テナント分離 | 生徒の `teacherId` を `ParentStudent` から辿る（直接 User クエリしない） |

**クエリパターン例（成績取得）:**
```typescript
// まず parentId から閲覧可能な studentId 一覧を取得
const links = await db.parentStudent.findMany({ where: { parentId: session.user.id } })
const studentIds = links.map(l => l.studentId)

// studentId が links に含まれているか確認してからクエリ
const grades = await db.gradeRecord.findMany({ where: { studentId: { in: studentIds } } })
```

---

## 7. 既存コードへの影響

| ファイル | 変更内容 |
| --- | --- |
| `lib/auth.ts` | `parent` ロールを JWT に含める |
| `lib/view-as.ts` | `effectiveRole === "parent"` を認識（`getViewingContext` で分岐不要なら変更不要） |
| `app/(app)/layout.tsx` | `role === "parent"` 時に保護者用サイドバーを表示 |
| `app/(app)/grades/page.tsx` | 保護者ロールの分岐を追加 |
| `app/(app)/calendar/page.tsx` | 保護者ロールの分岐を追加 |
| `app/(app)/billing/page.tsx` | 保護者ロールの分岐を追加 |
| `app/(app)/dashboard/page.tsx` | `ParentDashboard` コンポーネントを追加 |

---

## 8. 実装順序

1. **schema.prisma** 変更 → `prisma migrate dev --name add-parent-role`
2. **auth.ts** で `parent` ロールを認識
3. **招待フロー（先生側）**: `/students/[studentId]/invite-parent`
4. **招待受け入れ**: `/parent-invite/[token]` の登録ページ
5. **招待フロー（生徒側）**: 生徒ダッシュボードに招待リンク
6. **サイドバー**: `parent` ロール対応
7. **保護者ダッシュボード**: `ParentDashboard` コンポーネント
8. **成績ページ**: 保護者ブランチ追加
9. **カレンダー**: 保護者ブランチ追加
10. **請求ページ**: 保護者ブランチ追加

---

## 9. 設計決定済み事項

### 既存アカウントを持つ保護者が招待リンクを踏んだ場合

登録フォームで email 重複を検出したら、登録エラーではなく以下のフローに切り替える。

1. 「このメールアドレスはすでに登録されています。[ログインして続行]」を表示
2. ログインリダイレクト先を `/login?next=/parent-invite/[token]` にする
3. ログイン後トークンページに戻り、`ParentStudent` レコードだけ追加して `/dashboard` へ

**実装ポイント:**

- `/parent-invite/[token]` のページ: セッションがある場合は登録フォームを出さず、確認 → `ParentStudent` 作成のみ行う
- `next` パラメータを `login` ページが受け取って認証後リダイレクト（既存の `next` 処理があれば流用）

### 招待リンクの通知手段

メール送信機能なし → 生成した URL をコピー & LINE 貼り付けが現実的。既存の生徒招待と同じ UX。

### 保護者が後から別の生徒を追加したい場合

追加の招待トークンを新たに発行 → 保護者が同じアカウントでリンクを踏む → 上記フローで `ParentStudent` が追加される。
