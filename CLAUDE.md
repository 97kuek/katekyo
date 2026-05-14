# CLAUDE.md

## プロジェクト概要

家庭教師と生徒の間で宿題の進捗・成績・授業スケジュールを管理するWebアプリ。
複数の先生が利用できるマルチテナント構造。

## 技術スタック

- **Next.js 16** (App Router) + TypeScript
- **Prisma** ORM + **Supabase** (PostgreSQL)
- **NextAuth.js v5** 認証
- **shadcn/ui** + Tailwind CSS
- **Recharts** グラフ
- **Zod** バリデーション

## ディレクトリ構成

```text
src/
├── app/
│   ├── (auth)/           # login, register, invite/[token]
│   └── (app)/            # dashboard, students/, homework/, grades/, calendar/, subjects/
├── components/
│   ├── ui/               # shadcn/ui の基本コンポーネント
│   ├── homework/         # 宿題関連コンポーネント（StatusBadge等）
│   └── layout/           # header, sidebar, bottom-nav
├── lib/
│   ├── auth.ts           # NextAuth 設定
│   ├── db.ts             # Prisma クライアント
│   └── grades.ts         # 学年選択肢の定数（GRADE_OPTIONS）
prisma/
└── schema.prisma
```

## 開発コマンド

```bash
npm run dev          # 開発サーバー起動
npm run build        # ビルド
npm run lint         # ESLint
npx tsc --noEmit     # 型チェック
npx prisma studio    # DB GUI
npx prisma migrate dev --name <name>  # マイグレーション作成
npx prisma generate  # Prisma Client 再生成
```

## 環境変数

`.env.local` に以下を設定する：

```bash
DATABASE_URL=          # Supabase の接続文字列
DIRECT_URL=            # Supabase の Direct URL（マイグレーション用）
NEXTAUTH_SECRET=       # openssl rand -base64 32 で生成
NEXTAUTH_URL=          # 開発時は http://localhost:3000
```

## 認可の実装方針

- 全 Server Action・Route Handler でセッションを確認する
- `teacher` は自分の生徒のデータのみ操作可能
- `student` は自分のデータのみ参照可能（Lesson作成・削除は不可）
- 権限チェックは必ずサーバー側で行う。クライアント側のロール判定はUIの表示制御のみ

## データアクセスの原則

- Prisma クエリには必ず `teacherId` または `studentId` の絞り込みを含める（データ漏洩防止）
- 直接 `findFirst({ where: { id } })` だけで取得しない

## コーディング規約

- Server Component をデフォルトとし、インタラクションが必要な場合のみ `"use client"` を付ける
- データフェッチは Server Component で行い、ミューテーションは Server Actions を使用する
- Zod スキーマはすべての Server Action でバリデーションに使用する
- 学年は `src/lib/grades.ts` の `GRADE_OPTIONS` を使用し、フリーテキスト入力しない

## 主要なビジネスロジック

### 宿題ステータス遷移

```text
assigned → submitted（生徒の完了報告）→ approved（先生承認）
                                      → rejected（先生差し戻し、生徒が再提出可能）
```

- `submitted` にできるのは生徒本人かつ `assigned` or `rejected` 状態のみ
- `approved` / `rejected` にできるのは担当の先生のみ
- 先生が編集できるのは `assigned` or `rejected` 状態の宿題のみ

### 招待フロー

- 先生が `/students/invite` で生徒名・メール・学年を入力し招待リンクを生成（7日有効）
- 生徒が招待リンクを開き、名前・メール・学年の確認後パスワードを設定してアカウント作成
- ログイン済みの状態で招待リンクを開くと先にログアウトするよう促す
- `usedAt` が null かつ `expiresAt` が未来であることを必ず確認する

### 授業（Lesson）

- 先生がカレンダーから授業を登録：日時・生徒・オンライン/対面・所要時間・メモ
- 生徒は自分の授業のみ閲覧可（作成・削除不可）

## UIの指針

- shadcn/ui のコンポーネントを積極的に活用する
- モバイル: 固定ボトムナビ（`md:hidden`）、デスクトップ: サイドバー（`hidden md:flex`）
- テーブルは `overflow-hidden overflow-x-auto` + `min-w-[Xpx]` でモバイル対応
- main の padding: `p-4 md:p-6 pb-20 md:pb-6`（ボトムナビ分の余白）
- 承認待ちの宿題はダッシュボード最上部にバッジ付きで表示
- 成績グラフは点数と偏差値を切り替えられるようにする
