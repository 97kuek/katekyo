# AGENTS.md

家庭教師と生徒の間で宿題・成績・授業スケジュールを管理する Web アプリ。  
マルチテナント構造（1先生 = 1テナント）。ロール: `teacher` / `student` / `parent`（閲覧専用）。

このファイルは Codex 向けのリポジトリ共通指示です。Claude Code を使う場合も同じ内容を参照し、ツール固有の操作だけ `CLAUDE.md` や `.claude/` 配下で補足します。

## ドキュメント

| ファイル | 内容 |
| --- | --- |
| [README.md](README.md) | プロダクト概要・デモアカウント・機能一覧・技術スタック |
| [docs/usecases.md](docs/usecases.md) | ロール別ユースケース一覧（先生・生徒・保護者の利用シナリオ） |
| [docs/requirements.md](docs/requirements.md) | 実装上のルール・制約・ビジネスロジック |
| [docs/architecture.md](docs/architecture.md) | ディレクトリ構成・ページ一覧・CSR/SSR/SSG方針・テスト戦略・レスポンシブ設計 |
| [docs/data-models.md](docs/data-models.md) | Prisma スキーマ・Enum・インデックス設計・テナント分離・クエリ原則 |
| [docs/api-spec.md](docs/api-spec.md) | Server Actions・Route Handlers・Zod バリデーション |
| [docs/DESIGN.md](docs/DESIGN.md) | カラートークン・ボタン・フォーム・レイアウト・アニメーション規則 |
| [docs/parent-account-spec.md](docs/parent-account-spec.md) | 保護者アカウント（招待フロー・ページ構成・セキュリティ設計） |
| [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) | セットアップ・開発運用・テストコマンド・環境変数・ブランチ戦略 |
| [docs/line-notification-plan.md](docs/line-notification-plan.md) | LINE 通知実装計画 |
| [docs/meet-reminder-plan.md](docs/meet-reminder-plan.md) | Google Meet リマインダー実装計画 |
| [todo.md](todo.md) | バックログ |

## 主要コマンド

```bash
npm run dev                            # 開発サーバー（Turbopack）
npm run build                          # 本番ビルド（prisma generate 込み）
npm run lint                           # ESLint
npx tsc --noEmit                       # 型チェック
npx prisma migrate dev --name <name>   # スキーマ変更時
```

変更後は影響範囲に応じて `npm run lint`、`npx tsc --noEmit`、`npm run build` の順に確認する。Prisma スキーマを変更した場合は生成 SQL を確認し、必要なら `npx prisma generate` も実行する。

## 自動生成ファイル（直接編集禁止）

| パス | 生成元 |
| --- | --- |
| `src/generated/prisma/` | `prisma generate` |
| `.next/` | `next build` |
| `tsconfig.tsbuildinfo` | TypeScript |

## 用語集

| 用語 | 説明 |
| --- | --- |
| テナント | 先生1人 + その生徒群。データは `teacherId` で完全分離 |
| teacherId | 全 DB クエリに必須の絞り込みキー。省略禁止 |
| Garden（学習の森） | 宿題承認数で植物が育つゲーミフィケーション機能 |
| BulkApprove | submitted 状態の宿題を一括承認する UI パターン |
| GRADE_OPTIONS | `src/lib/grades.ts` の学年定数（フリーテキスト不可） |
| TEST_TYPE_OPTIONS | `src/lib/test-types.ts` のテスト種別定数 |

## コーディング原則

- Server Component をデフォルトにする。`"use client"` はインタラクションが必要なコンポーネントに限定する。
- Server Action は必ず セッション確認 → Zod バリデーション → `teacherId` / `studentId` によるテナント絞り込み の順で実装する。
- `findFirst({ where: { id } })` のみのクエリは禁止。テナント漏洩防止のため、必ず権限境界になる条件を含める。
- カラーは CSS 変数トークン（`bg-card`, `text-muted-foreground` など）を使う。ハードコードを増やさない。
- 既存の UI パターン、shadcn/ui、Tailwind CSS v4 の書き方を優先し、不要な抽象化を追加しない。
- `.env*` や service role key などの秘密情報をコミット・表示・ログ出力しない。

## エージェント運用

- Codex はこの `AGENTS.md` をリポジトリ共通の作業指示として使う。
- Claude Code は `CLAUDE.md` からこのファイルを参照する。共通ルールを変える場合は原則 `AGENTS.md` を更新する。
- `.claude/commands/` や `.claude/skills/` は Claude Code 専用。Codex で同等の手順が必要な場合は、このファイルか関連ドキュメントに移す。
- ツール固有の slash command は混同しない。Claude Code の `/rename` や `/clear` は Codex の必須手順ではない。
- 大きめの作業では、実装前に対象ファイル・検証コマンド・リスクを短く整理してから進める。
