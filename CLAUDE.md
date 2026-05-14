# CLAUDE.md

## プロジェクト概要

家庭教師と生徒の間で宿題の進捗・成績を管理するWebアプリ。
複数の先生が利用できるマルチテナント構造。詳細は `spec.md` を参照。

## 技術スタック

- **Next.js 15** (App Router) + TypeScript
- **Prisma** ORM + **Supabase** (PostgreSQL)
- **NextAuth.js v5** 認証
- **shadcn/ui** + Tailwind CSS
- **Recharts** グラフ
- **Zod** バリデーション

## ディレクトリ構成

```
src/
├── app/
│   ├── (auth)/           # login, register, invite/[token]
│   ├── (teacher)/        # dashboard, students/, subjects/
│   ├── (student)/        # dashboard, homework/, grades/
│   └── api/              # Route Handlers
├── components/
│   ├── ui/               # shadcn/ui の基本コンポーネント
│   ├── homework/         # 宿題関連コンポーネント
│   ├── grades/           # 成績関連コンポーネント
│   └── layout/           # ヘッダー・サイドバー等
├── lib/
│   ├── auth.ts           # NextAuth 設定
│   ├── db.ts             # Prisma クライアント
│   └── validations/      # Zod スキーマ
└── types/                # 共通型定義
prisma/
└── schema.prisma
```

## 開発コマンド

```bash
npm run dev          # 開発サーバー起動
npm run build        # ビルド
npm run lint         # ESLint
npx prisma studio    # DB GUI
npx prisma migrate dev --name <name>  # マイグレーション作成
npx prisma generate  # Prisma Client 再生成
```

## 環境変数

`.env.local` に以下を設定する（`.env.example` を参照）：

```
DATABASE_URL=          # Supabase の接続文字列
DIRECT_URL=            # Supabase の Direct URL（マイグレーション用）
NEXTAUTH_SECRET=       # openssl rand -base64 32 で生成
NEXTAUTH_URL=          # 開発時は http://localhost:3000
```

## 認可の実装方針

- 全 API Route Handler でセッションを確認する
- `teacher` は自分の生徒のデータのみ操作可能
- `student` は自分のデータのみ参照可能（作成・削除は不可）
- 権限チェックは必ずサーバー側（Route Handler / Server Action）で行う
- クライアント側のロール判定はUIの表示制御のみに使用する

## データアクセスの原則

- Prisma クエリには必ず `teacherId` または `studentId` の絞り込みを含める（データ漏洩防止）
- 例: `prisma.homework.findMany({ where: { teacherId: session.user.id } })`
- 直接 `findFirst({ where: { id } })` だけで取得しない

## コーディング規約

- Server Component をデフォルトとし、インタラクションが必要な場合のみ `"use client"` を付ける
- データフェッチは Server Component または Route Handler で行う
- フォームの送信は Server Actions を優先的に使用する
- API レスポンスは `{ data, error }` の形式で統一する
- Zod スキーマはリクエストボディのバリデーションに必ず使用する

## 主要なビジネスロジック

### 宿題ステータス遷移
```
assigned → submitted（生徒の完了報告）→ approved（先生承認）
                                      → rejected（先生差し戻し、生徒が再提出可能）
```
- `submitted` にできるのは生徒本人かつ `assigned` or `rejected` 状態のみ
- `approved` / `rejected` にできるのは担当の先生のみ

### 招待トークン
- 有効期限は生成から7日間（`expiresAt`）
- 使用後は `usedAt` をセットして無効化
- `/invite/[token]` は `usedAt` が null かつ `expiresAt` が未来であることを確認する

## UIの指針

- shadcn/ui のコンポーネントを積極的に活用する
- 承認待ちの宿題は先生ダッシュボードの最上部にバッジ付きで表示する
- 成績グラフは点数と偏差値を切り替えられるようにする
- モバイル対応（レスポンシブ）を考慮する
