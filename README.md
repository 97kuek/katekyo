# katekyo

家庭教師と生徒の間で宿題の進捗・成績・授業スケジュールを管理するWebアプリ。

## 機能

### 先生側

- **生徒管理**: 招待リンク発行（7日間有効）・URL再表示コピー、生徒一覧（名前/学年/登録日/進捗順ソート）・削除、生徒パスワードリセット
- **宿題管理**: 作成・編集・削除・期限延長、タイトル検索・科目タグフィルタ・期限/作成日ソート・生徒フィルタ、提出物の承認/差し戻し/一括承認
- **成績管理**: 記録（模試/定期テスト/小テスト/その他）、種別フィルタ・生徒フィルタ、生徒選択時にグラフ表示、生徒個別成績ページ（グラフ付き）
- **授業カレンダー**: 授業の登録（週次繰り返し対応）・編集・削除、所要時間のデフォルト記憶、月/週表示切り替え、今月/今週ボタン
- **科目タグ管理**: 科目の追加・削除（確認ダイアログ付き）
- **ダッシュボード**: 承認待ち宿題・生徒別進捗・成績動向・直近授業/期限をストリーミング表示

### 生徒側

#### ダッシュボード

未完了/期限切れ/承認待ちカード・直近成績・授業一覧

![ダッシュボード](/assets/home.jpg)

#### 学習の森

![学習の森](/assets/forest.jpg)

#### カレンダー

自分の授業確認（月/週表示、読み取り専用）

![カレンダー](/assets/calendar.jpg)

#### 宿題提出

提出報告・取り消し、ステータス確認（未着手/提出済/承認/差し戻し）

![宿題](/assets/homework.jpg)

#### 成績確認

点数率・偏差値グラフ（科目別ライン、クラス平均比較、自動スケール）

![成績推移](/assets/grades.jpg)

### 共通

- **プロフィール編集**: 名前・パスワード変更
- **使い方ガイド**: アプリ内ヘルプページ（先生・生徒別）
- **レスポンシブ対応**: モバイルはカード表示・ボトムナビ、タブレットはアイコンサイドバー、PC はフルサイドバー

## 技術スタック

- **Next.js 16** (App Router, Turbopack) + TypeScript
- **Prisma 7** + **Supabase** (PostgreSQL)
- **NextAuth.js v5** (JWT認証)
- **shadcn/ui** + Tailwind CSS v4
- **Recharts** (成績グラフ)
- **Zod** (バリデーション)
- **Sonner** (トースト通知)

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
npx tsc --noEmit     # 型チェック
npx prisma studio    # DB GUI
npx prisma migrate dev --name <name>  # マイグレーション作成
npx prisma generate  # Prisma Client 再生成
```

## デプロイ (Vercel)

1. Vercel でプロジェクトを作成し、このリポジトリを接続
2. Environment Variables に以下を設定：
   - `DATABASE_URL`: Supabase pooler URL
   - `DIRECT_URL`: Supabase direct URL（マイグレーション用）
   - `NEXTAUTH_SECRET`: ランダムな秘密鍵
   - `NEXTAUTH_URL`: 本番ドメイン（例: `https://katekyo-one.vercel.app`）
3. Deploy

スキーマ変更時は `npx prisma migrate dev` → `git push` でVercelが自動デプロイ。

## Supabase 無料枠について

| 項目               | 制限                         |
| ------------------ | ---------------------------- |
| DB容量             | 500MB                        |
| 転送量             | 5GB / 月                     |
| 同時プロジェクト数 | 2                            |
| 非アクティブ停止   | 7日間アクセスなしで自動停止  |

> **注意**: 7日間DBへのアクセスがないとプロジェクトが一時停止されます。停止後は次のアクセス時に約30秒で復旧しますが、定期的に使用することで防止できます。有料プラン（Pro: $25/月）にアップグレードすると停止しなくなります。
