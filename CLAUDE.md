# CLAUDE.md

家庭教師と生徒の間で宿題・成績・授業スケジュールを管理する Web アプリ。  
マルチテナント構造（1先生 = 1テナント）。ロール: `teacher` / `student` / `parent`（閲覧専用）。

## ドキュメント

| ファイル | 内容 |
| --- | --- |
| [docs/architecture.md](docs/architecture.md) | ディレクトリ構成・ページ一覧・レスポンシブ設計 |
| [docs/DESIGN.md](docs/DESIGN.md) | カラートークン・ボタン・レイアウト規則 |
| [docs/data-models.md](docs/data-models.md) | Prisma スキーマ・Enum・クエリ原則 |
| [docs/requirements.md](docs/requirements.md) | 機能要件・ビジネスロジック |
| [docs/api-spec.md](docs/api-spec.md) | Server Actions・Route Handlers |
| [docs/parent-account-spec.md](docs/parent-account-spec.md) | 保護者アカウント（招待フロー・ページ構成・セキュリティ設計） |
| [docs/development.md](docs/development.md) | セットアップ・デプロイ・環境変数・ブランチ戦略 |
| [docs/line-notification-plan.md](docs/line-notification-plan.md) | LINE 通知実装計画 |
| [docs/meet-reminder-plan.md](docs/meet-reminder-plan.md) | Google Meet リマインダー実装計画 |
| [todo.md](todo.md) | バックログ |

## 主要コマンド

```bash
npm run dev                            # 開発サーバー（Turbopack）
npm run build                          # 本番ビルド（prisma generate 込み）
npm run lint                           # ESLint（自動: PostToolUse フック）
npx tsc --noEmit                       # 型チェック
npx prisma migrate dev --name <name>   # スキーマ変更時 → /migrate 参照
```

## 自動生成ファイル（直接編集禁止）

| パス | 生成元 |
| --- | --- |
| `src/generated/prisma/` | `prisma generate` |
| `.next/` | `next build` |

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

- Server Component をデフォルト。`"use client"` はインタラクション必要時のみ
- Server Action は必ず: セッション確認 → Zod バリデーション → `teacherId` 絞り込み（→ `/server-action`）
- `findFirst({ where: { id } })` のみ → 禁止（テナント漏洩防止）
- カラーは CSS 変数トークン使用（`bg-card`, `text-muted-foreground` 等）。ハードコード禁止

## セッション管理

タスクの切れ目で `/rename <task-name>` でセッション名を付けてから `/clear` でコンテキストをリセットする。
