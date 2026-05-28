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

# DBマイグレーション
npx prisma migrate dev

# 開発サーバー起動
npm run dev
```

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

```bash
npm run dev            # 開発サーバー（Turbopack）
npm run build          # 本番ビルド（prisma generate 込み）
npm run lint           # ESLint チェック
npx tsc --noEmit       # 型チェック
npx prisma studio      # DB GUI ブラウザで確認
npx prisma migrate dev --name <name>  # マイグレーション作成（→ /migrate）
```

---

## 環境変数（`.env.local`）

```bash
DATABASE_URL=                   # Supabase 接続文字列（pooler）
DIRECT_URL=                     # Supabase Direct URL（マイグレーション用）
NEXTAUTH_SECRET=                 # openssl rand -base64 32
NEXTAUTH_URL=                    # 開発時: http://localhost:3000
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

Supabase Storage: バケット `homework-photos` を **Public** で作成する。

---

## AI セッション管理（Claude Code）

コーディングセッションの切れ目ごとに以下を実行してコンテキストを整理する:

1. **セッション名をつける**: `/rename <task-name>`  
   例: `/rename add-line-notification`, `/rename homework-filter-layout`
2. **コンテキストをリセット**: `/clear`  
   次のタスクを新鮮なコンテキストで開始できる

これを怠るとコンテキストが肥大化し、応答品質と速度が低下する。
