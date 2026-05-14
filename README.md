# katekyo

家庭教師と生徒の間で宿題の進捗・成績を管理するWebアプリ。

## 機能

- **先生**: 生徒の招待・管理、宿題の作成・承認/差し戻し、成績記録、科目タグ管理
- **生徒**: 宿題の提出報告、成績の確認（グラフ付き）

## 技術スタック

- **Next.js 16** (App Router, Turbopack) + TypeScript
- **Prisma 7** + **Supabase** (PostgreSQL)
- **NextAuth.js v5** (JWT認証)
- **shadcn/ui** + Tailwind CSS v4
- **Recharts** (成績グラフ)
- **Zod** (バリデーション)

## ローカル開発

### 1. リポジトリのクローン

```bash
git clone https://github.com/97kuek/katekyo.git
cd katekyo
npm install
```

### 2. 環境変数の設定

`.env.local` を作成し、以下を設定する：

```
DATABASE_URL="postgresql://..."   # Supabase pooler URL (port 6543, ?pgbouncer=true)
DIRECT_URL="postgresql://..."     # Supabase direct URL (port 5432, マイグレーション用)
NEXTAUTH_SECRET="..."             # openssl rand -base64 32 で生成
NEXTAUTH_URL="http://localhost:3000"
```

Supabase の接続文字列は Dashboard → Project Settings → Database → Connection string から取得。

### 3. DBのセットアップ

```bash
npx prisma migrate dev
npx prisma generate
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

`http://localhost:3000` にアクセス → `/register` で先生アカウントを作成。

## 開発コマンド

```bash
npm run dev          # 開発サーバー起動
npm run build        # ビルド
npm run lint         # ESLint
npx prisma studio    # DB GUI
npx prisma migrate dev --name <name>  # マイグレーション作成
npx prisma generate  # Prisma Client 再生成
```

## デプロイ (Vercel)

1. Vercel でプロジェクトを作成し、このリポジトリを接続
2. Environment Variables に以下を設定：
   - `DATABASE_URL`: Supabase pooler URL
   - `NEXTAUTH_SECRET`: ランダムな秘密鍵
   - `NEXTAUTH_URL`: 本番ドメイン（例: `https://katekyo-one.vercel.app`）
3. Deploy

スキーマ変更時は `npx prisma migrate dev` → `git push` でVercelが自動デプロイ。

## Supabase 無料枠について

| 項目 | 制限 |
|------|------|
| DB容量 | 500MB |
| 転送量 | 5GB / 月 |
| 同時プロジェクト数 | 2 |
| **非アクティブ時の一時停止** | **7日間DBアクセスなしで自動停止** |

> **注意**: 7日間DBへのアクセスがないとプロジェクトが一時停止されます。停止後は次のアクセス時に約30秒で復旧しますが、定期的に使用することで防止できます。有料プラン（Pro: $25/月）にアップグレードすると停止しなくなります。
