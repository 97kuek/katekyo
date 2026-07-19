# 開発ガイド

## ブランチ戦略

GitHub Flow をベースにしたシンプルな運用。

```
main
 └─ feature/xxx    新機能
 └─ fix/xxx        バグ修正
 └─ chore/xxx      依存更新・設定変更・リファクタリング
 └─ docs/xxx       ドキュメントのみの変更
```

### ルール

- `main` は常にデプロイ可能な状態を保つ
- 作業は必ずブランチを切ってから行う
- `main` への直接プッシュは禁止
- マージは PR 経由で行う（レビュー済みであること）
- ブランチ名は英語・ケバブケースで書く

### ブランチ名の例

```
feature/homework-submission
feature/grade-chart
fix/invite-token-expiry
chore/update-prisma
docs/add-api-spec
```

---

## コミットメッセージ

[Conventional Commits](https://www.conventionalcommits.org/) に従う。

### フォーマット

```
<type>: <概要（英語・現在形）>

[本文（任意）]
```

### type 一覧

| type | 使いどころ |
|---|---|
| `feat` | 新機能の追加 |
| `fix` | バグ修正 |
| `chore` | ビルド・依存・設定変更（機能に影響しない） |
| `docs` | ドキュメントのみの変更 |
| `refactor` | 動作を変えないコードの整理 |
| `test` | テストの追加・修正 |
| `style` | フォーマット・空白・セミコロン等（ロジックに影響しない） |

### コミットメッセージの例

```
feat: add homework submission flow
feat: display grade history chart
fix: reject expired invite tokens correctly
chore: install shadcn/ui and configure theme
docs: update API endpoint list in spec
refactor: extract auth session helper
```

### NG例

```
# ❌ 曖昧すぎる
fix: fix bug
update: update stuff

# ❌ 日本語（英語統一）
feat: 宿題提出機能を追加

# ❌ type なし
add grade chart
```

---

## PR ワークフロー

1. `main` から作業ブランチを切る
   ```bash
   git switch -c feature/xxx
   ```
2. 細かくコミットを積む（WIPでもOK）
3. 完了したら GitHub に push
   ```bash
   git push -u origin feature/xxx
   ```
4. PR を作成し、概要・動作確認方法を記載する
5. セルフレビューして `main` にマージ
6. ブランチを削除する

---

## 開発環境セットアップ

```bash
# 依存インストール
npm install

# 環境変数設定
cp .env.example .env.local
# .env.local を編集して各値を入力

# DBスキーマ同期（migration history が存在しない/ドリフトがある場合）
npx prisma db push            # スキーマをDBに直接適用（migration history を更新しない）
npx prisma generate           # Prisma クライアントを再生成（db push 後は手動実行が必要）

# DBマイグレーション（新規環境の場合）
npx prisma migrate dev

# 開発サーバー起動
npm run dev
```

> **注意**: `db push` はマイグレーション履歴（`prisma/migrations/`）を更新しない。スキーマのドリフト解消や開発初期のみ使用し、本番環境では `prisma migrate deploy` を使うこと。`npm run build` は `VERCEL_ENV=production` のときだけビルド前に `prisma migrate deploy` を実行する。Preview / ローカルビルドではDBを変更しない。本番の `DIRECT_URL` には Direct connection または Session pooler（ポート `5432`）を設定し、Transaction pooler（ポート `6543`）は使わない。

## 年次データクリーンアップ（手動実行）

毎年4月1日ごろに実行する。前々年度（1年前の4月1日より前）のデータを削除する。

Supabase ダッシュボード → **SQL Editor** で以下を実行：

```sql
-- 前々年度のカットオフ日（例: 2025年4月実行なら 2024-04-01）
-- 実行前に年を確認すること

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

> **注意**: 実行前に `SELECT COUNT(*)` で件数を確認してから削除すること。

---

## 便利コマンド

ドキュメントを変更した場合は、相対リンク、見出しアンカー、PlantUMLの基本構造、要件トレーサビリティを確認する。

```bash
npm run docs:check
npm run ui:check      # 絵文字・標準confirm・同系色背景/文字の混入検査
```

```bash
npm run dev            # 開発サーバー（Turbopack）
npm run build          # 本番ビルド（prisma generate 込み）
npm run lint           # ESLint チェック
npx tsc --noEmit       # 型チェック
npm test               # ユニットテスト一回実行（CI 向け）
npm run test:watch     # ユニットテストをウォッチモードで実行（開発中）
npm run test:coverage  # カバレッジレポート生成
npx prisma studio      # DB GUI ブラウザで確認
npx prisma migrate dev --name <name>  # マイグレーション作成（→ /migrate）
```

---

## 環境変数（`.env.local`）

```bash
DATABASE_URL=                   # Supabase 接続文字列（pooler）
DIRECT_URL=                     # 必須: Supabase Direct URL / Session pooler :5432（本番マイグレーション用。:6543は禁止）
NEXTAUTH_SECRET=                 # openssl rand -base64 32
NEXTAUTH_URL=                    # 開発時: http://localhost:3000
AUTH_GOOGLE_ID=                  # Google OAuth 2.0 クライアントID（任意。SECRETと同時設定）
AUTH_GOOGLE_SECRET=              # Google OAuth 2.0 クライアントシークレット
SUPABASE_URL=                    # Project Settings > API
SUPABASE_SERVICE_ROLE_KEY=       # Service Role Key ※絶対に公開しない
CRON_SECRET=                     # openssl rand -base64 32
QSTASH_TOKEN=                    # Upstash QStash API トークン
QSTASH_CURRENT_SIGNING_KEY=      # QStash Webhook 署名検証キー（現在）
QSTASH_NEXT_SIGNING_KEY=         # QStash Webhook 署名検証キー（ローテーション用）
LINE_CHANNEL_ACCESS_TOKEN=       # LINE Messaging API チャネルアクセストークン
LINE_CHANNEL_SECRET=             # LINE チャネルシークレット（Webhook署名検証用）
LINE_RICH_MENU_TEACHER_ID=       # LINE リッチメニューID（先生用）
LINE_RICH_MENU_STUDENT_ID=       # LINE リッチメニューID（生徒用）
```

Google Cloud Console の承認済みリダイレクトURIには、`<NEXTAUTH_URL>/api/auth/callback/google` を登録する。既存利用者は従来ログイン後、設定画面からGoogleアカウントを明示連携する。メールアドレス一致による自動統合は行わない。

Supabase Storage: バケット `homework-photos` を **Private** で作成する。既存環境もPrivateへ変更する。

---

## AI エージェント運用（Codex / Claude Code）

共通の作業指示はリポジトリ直下の [AGENTS.md](../AGENTS.md) に集約する。設計方針、主要コマンド、テナント分離ルール、検証方針を変更する場合は `AGENTS.md` を更新する。

Claude Code は [CLAUDE.md](../CLAUDE.md) から `AGENTS.md` を参照する。Claude Code 固有のカスタムコマンドやスキルは `.claude/` 配下に置く。

### セッション整理

- Codex: unrelated な作業は新しいスレッドで開始する。大きい作業では必要に応じて `/plan` で進め方を整理する。
- Claude Code: タスクの切れ目で必要に応じて `/rename <task-name>` と `/clear` を使う。

ツール固有の slash command は混同しない。共通化したい手順は `.claude/` だけに置かず、`AGENTS.md` または `docs/` に移す。
