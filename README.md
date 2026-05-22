# katekyo

> 家庭教師と生徒をつなぐ、学習管理 Web アプリ

宿題の提出・承認から授業スケジュール・成績管理まで、家庭教師業務をまるごとデジタル化。LINE 通知や Google Meet 連携で、授業外のコミュニケーションもスムーズに。

## 主な機能

### 生徒ダッシュボード

今日やるべきことが一目でわかる。期限切れ宿題・直近テスト・次の授業をまとめて表示。

### 宿題管理

先生が宿題を登録 → 生徒が提出（写真添付可）→ 先生が承認 / 差し戻し。ステータスの流れがシンプルで直感的。

- 提出時に写真（5MB 以内）を添付できるので、ノートの写真でそのまま提出
- 承認・差し戻し時に生徒の LINE へ即時通知
- 複数宿題の一括承認に対応

### 学習の森

宿題が承認されるたびに、アイソメトリックな森に植物が 1 つ育つ。差し戻しや期限切れで木が枯れ、再提出で回復するシンプルなゲーム要素で継続を後押し。

### 成績管理

テスト・模試の点数と偏差値を記録。生徒ごとの推移グラフでどれだけ伸びたかが一目でわかる。

### 授業カレンダー

対面・オンラインの授業を登録・管理。先生・生徒ともに月表示・週表示で確認できる。

- オンライン授業の登録で Google Meet 参加ボタンをカードに表示
- 授業開始 10 分前に生徒の LINE へ Meet リンクを自動送信（[Upstash QStash](https://upstash.com/docs/qstash/overall/getstarted) 使用）
- 授業完了マークをつけると請求管理に自動反映

### LINE 通知

設定ページで 6 桁コードを発行 → LINE 公式アカウントに送信するだけで連携完了。以降は以下のイベントで自動通知が届く。

| タイミング | 受信者 |
| --- | --- |
| 宿題提出 | 先生 |
| 宿題承認 / 差し戻し | 生徒 |
| オンライン授業 10 分前 | 生徒 |
| 毎週日曜（未提出・期限切れ宿題がある場合） | 生徒 |
| 毎月 1 日（前月の授業レポート） | 先生 |


### 請求管理

完了済み授業の時給・交通費から月次の請求額を自動計算。生徒別の内訳と合計を一覧表示し、入金確認もアプリ上で管理できる。

## 技術スタック

| カテゴリ | 採用技術 |
| --- | --- |
| フレームワーク | Next.js 16 (App Router) + TypeScript |
| データベース | Prisma 7 + Supabase (PostgreSQL) |
| 認証 | NextAuth.js v5 (JWT) |
| UI | shadcn/ui + Tailwind CSS v4 |
| グラフ | Recharts |
| バリデーション | Zod |
| 通知 | LINE Messaging API |
| スケジューリング | Upstash QStash |
| ストレージ | Supabase Storage |
| デプロイ | Vercel |

## ローカル開発

### 1. リポジトリのクローン

```bash
git clone https://github.com/97kuek/katekyo.git
cd katekyo
npm install
```

### 2. 環境変数の設定

`.env.local` を作成し、以下を設定する：

```env
DATABASE_URL="postgresql://..."      # Supabase pooler URL (port 6543, ?pgbouncer=true)
DIRECT_URL="postgresql://..."        # Supabase direct URL (port 5432, マイグレーション用)
NEXTAUTH_SECRET="..."                # openssl rand -base64 32 で生成
NEXTAUTH_URL="http://localhost:3000"
```

LINE 通知・Meet リマインダーを使う場合は追加で設定が必要。詳細は [docs/development.md](docs/development.md) を参照。

### 3. DB のセットアップ

```bash
npx prisma migrate dev
npx prisma generate
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

`http://localhost:3000` にアクセス → `/register` で先生アカウントを作成。

### 開発コマンド

```bash
npm run dev                               # 開発サーバー起動
npm run build && npm run lint             # ビルド + lint
npx tsc --noEmit                          # 型チェック
npx prisma studio                         # DB GUI
npx prisma migrate dev --name <name>      # マイグレーション作成
npx prisma generate                       # Prisma Client 再生成
```

## デプロイ (Vercel)

1. Vercel でプロジェクトを作成し、このリポジトリを接続
2. Environment Variables に以下を設定：
   - `DATABASE_URL` / `DIRECT_URL` — Supabase 接続文字列
   - `NEXTAUTH_SECRET` — ランダムな秘密鍵
   - `NEXTAUTH_URL` — 本番ドメイン（例: `https://katekyo-one.vercel.app`）
3. Deploy

スキーマ変更時は `npx prisma migrate dev` → `git push` で Vercel が自動デプロイ。

## ドキュメント

| ファイル | 内容 |
| --- | --- |
| [docs/architecture.md](docs/architecture.md) | ディレクトリ構成・ページ一覧・レイアウト |
| [docs/data-models.md](docs/data-models.md) | Prisma モデル全定義 |
| [docs/requirements.md](docs/requirements.md) | 機能要件・ビジネスロジック |
| [docs/api-spec.md](docs/api-spec.md) | Server Actions・Route Handlers 一覧 |
| [docs/development.md](docs/development.md) | 開発環境セットアップ・トラブルシューティング |
