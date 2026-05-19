# CLAUDE.md

## プロジェクト概要

家庭教師と生徒の間で宿題・成績・授業スケジュールを管理する Web アプリ。
複数の先生が利用できるマルチテナント構造。ロール: `teacher` / `student`。

## 詳細ドキュメント

| ファイル | 内容 |
| --- | --- |
| [docs/architecture.md](docs/architecture.md) | ディレクトリ構成・ページ一覧・レイアウト・ナビゲーション・レスポンシブ設計 |
| [docs/data-models.md](docs/data-models.md) | Prisma モデル全定義・Enum・データアクセス原則 |
| [docs/requirements.md](docs/requirements.md) | 機能要件・ビジネスロジック（宿題/授業/成績/森/招待/Cron） |
| [docs/api-spec.md](docs/api-spec.md) | Server Actions 一覧・Route Handlers・Zod パターン |
| [docs/garden-spec.md](docs/garden-spec.md) | 学習の森の仕様（植物種別・枯れロジック・グリッド・SVG 描画） |
| [docs/development.md](docs/development.md) | 開発環境セットアップ・デプロイ・トラブルシューティング |
| [todo.md](todo.md) | バックログ・完了済みタスク |

## 技術スタック

- **Next.js 16** (App Router) + TypeScript
- **Prisma** ORM + **Supabase** (PostgreSQL + Storage)
- **NextAuth.js v5** 認証
- **shadcn/ui** + Tailwind CSS / **Recharts** グラフ / **Zod** バリデーション

## 開発コマンド

```bash
npm run dev                              # 開発サーバー
npm run build && npm run lint            # ビルド＋lint
npx tsc --noEmit                         # 型チェック
npx prisma migrate dev --name <name>     # マイグレーション作成
npx prisma generate                      # Prisma Client 再生成
npx prisma studio                        # DB GUI
```

## 環境変数（`.env.local`）

```bash
DATABASE_URL=          # Supabase 接続文字列
DIRECT_URL=            # Supabase Direct URL（マイグレーション用）
NEXTAUTH_SECRET=       # openssl rand -base64 32
NEXTAUTH_URL=          # 開発時: http://localhost:3000
SUPABASE_URL=          # Project Settings > API
SUPABASE_SERVICE_ROLE_KEY=   # Service Role Key ※絶対に公開しない
CRON_SECRET=           # openssl rand -base64 32
```

Supabase Storage: バケット `homework-photos` を **Public** で作成する。

## コーディング規約

- Server Component をデフォルト。インタラクション必要時のみ `"use client"`
- データフェッチは Server Component、ミューテーションは Server Actions
- すべての Server Action で Zod バリデーションを使用する
- 学年は `src/lib/grades.ts` の `GRADE_OPTIONS` を使用（フリーテキスト不可）
- テスト種別は `src/lib/test-types.ts` の `TEST_TYPE_OPTIONS` を使用

## セキュリティ原則

- 全 Server Action・Route Handler でセッション確認必須
- Prisma クエリには必ず `teacherId` または `studentId` の絞り込みを含める
- `findFirst({ where: { id } })` だけの取得は禁止（データ漏洩防止）
- 権限チェックはサーバー側で行う。クライアント側はUI表示制御のみ
