# CLAUDE.md

## プロジェクト概要

家庭教師と生徒の間で宿題の進捗・成績・授業スケジュールを管理するWebアプリ。
複数の先生が利用できるマルチテナント構造。

## 技術スタック

- **Next.js 16** (App Router) + TypeScript
- **Prisma** ORM + **Supabase** (PostgreSQL + Storage)
- **NextAuth.js v5** 認証
- **shadcn/ui** + Tailwind CSS
- **Recharts** グラフ
- **Zod** バリデーション
- **@supabase/supabase-js** ファイルストレージ（宿題写真）

## ディレクトリ構成

```text
src/
├── app/
│   ├── (auth)/           # login, register, invite/[token]
│   └── (app)/            # dashboard, students/, homework/, grades/, calendar/, subjects/, garden/
│       └── students/[id]/garden/  # 先生用・生徒の森閲覧ページ
├── components/
│   ├── ui/               # shadcn/ui の基本コンポーネント
│   ├── homework/         # 宿題関連コンポーネント（StatusBadge等）
│   └── layout/           # header, sidebar, bottom-nav
├── lib/
│   ├── auth.ts               # NextAuth 設定
│   ├── db.ts                 # Prisma クライアント
│   ├── garden.ts             # 学習の森 Server Action（plantGardenItem）
│   ├── garden-utils.ts       # 学習の森 純粋ユーティリティ（scoreToGardenItemType）
│   ├── grades.ts             # 学年選択肢の定数（GRADE_OPTIONS）
│   ├── queries.ts            # React.cache() ラップの共通クエリ
│   ├── supabase-storage.ts   # Supabase Storage ヘルパー（宿題写真アップロード）
│   └── test-types.ts         # テスト種別の定数（TEST_TYPE_LABELS, TEST_TYPE_OPTIONS）
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
DATABASE_URL=                  # Supabase の接続文字列
DIRECT_URL=                    # Supabase の Direct URL（マイグレーション用）
NEXTAUTH_SECRET=               # openssl rand -base64 32 で生成
NEXTAUTH_URL=                  # 開発時は http://localhost:3000
SUPABASE_URL=                  # Supabase Project URL（Project Settings > API）
SUPABASE_SERVICE_ROLE_KEY=     # Service Role Key（Project Settings > API）※絶対に公開しない
CRON_SECRET=                   # Vercel Cron 認証トークン（openssl rand -base64 32 で生成）
```

### Supabase Storage のセットアップ

Supabase ダッシュボード > Storage から以下を行う：

1. バケット `homework-photos` を作成（**Public** に設定）
2. `SUPABASE_URL` と `SUPABASE_SERVICE_ROLE_KEY` を `.env.local` に追加

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
- テスト種別は `src/lib/test-types.ts` の `TEST_TYPE_OPTIONS` を使用する（mock/exam/quiz/other）

## 主要なビジネスロジック

### 宿題ステータス遷移

```text
assigned → submitted（生徒の完了報告）→ approved（先生承認）
                                      → rejected（先生差し戻し、生徒が再提出可能）
```

- `submitted` にできるのは生徒本人かつ `assigned` or `rejected` 状態のみ
- `approved` / `rejected` にできるのは担当の先生のみ
- 先生が編集できるのは `assigned` or `rejected` 状態の宿題のみ

### 宿題写真提出

- 生徒が提出時に宿題のページ写真を1枚添付できる（任意、5MB以内）
- 写真は Supabase Storage の `homework-photos` バケットへサーバーサイドでアップロード
- URL は `Homework.photoUrl` に保存。先生の確認ページと詳細ページに表示される
- アップロードヘルパー: `src/lib/supabase-storage.ts`

### 宿題ステータスと森の連動

| 宿題の状態 | 森への影響 |
| --- | --- |
| approved（承認） | 植物が1つ育つ（木40%・茂み30%・花30%） |
| rejected（差し戻し） | 古い植物1つが枯れて表示（提出で回復） |
| assigned かつ期限切れ | 古い植物1つが枯れて表示（提出で回復） |
| submitted（提出待ち） | 影響なし |

枯れはDBに保存せず動的に計算する（`rejected` 件数 + 期限切れ `assigned` 件数 = 枯れ数）。

### 自動クリーンアップ（Vercel Cron）

- スケジュール: 毎日 18:00 UTC（03:00 JST）
- エンドポイント: `GET /api/cron/cleanup-homework`（`Authorization: Bearer CRON_SECRET` で認証）
- 設定ファイル: `vercel.json`

クリーンアップ対象:

1. `status = "approved"` かつ `dueDate` から7日以上経過した宿題
2. 未使用かつ有効期限から7日以上経過した招待トークン
3. 使用済みかつ `usedAt` から30日以上経過した招待トークン

### 招待フロー

- 先生が `/students/invite` で生徒名・メール・学年を入力し招待リンクを生成（7日有効）
- 生徒が招待リンクを開き、名前・メール・学年の確認後パスワードを設定してアカウント作成
- ログイン済みの状態で招待リンクを開くと先にログアウトするよう促す
- `usedAt` が null かつ `expiresAt` が未来であることを必ず確認する

### 授業（Lesson）

- 先生がカレンダーから授業を登録：日時・生徒・オンライン/対面・所要時間・メモ
- 生徒は自分の授業のみ閲覧可（作成・削除不可）

### 成績（GradeRecord）

- `testType` は `mock`（模試）/ `exam`（定期テスト）/ `quiz`（小テスト）/ `other`（その他）の4択
- 先生の成績一覧はURL `?type=mock` 等でサーバーサイドフィルタリング
- 生徒の成績グラフは複数種別が存在する場合のみ種別フィルタを表示（クライアントサイド）
- 先生が生徒個別の成績を見るページ: `/students/[id]/grades`
- 成績登録時に数値データがある場合、スコアに応じた植物が森に育つ（`src/lib/garden.ts` の `scoreToGardenItemType`）

### 学習の森（Garden）

生徒の学習努力をアイソメトリックなインタラクティブ森として可視化するゲーム要素。

**アイテムが育つ条件（`src/lib/garden.ts` の `plantGardenItem`）:**

- 宿題承認 → ランダム選択（木40%・茂み30%・花30%）
- 成績登録（点数あり）: score/maxScore ≥ 80% → 木、60-79% → 茂み、< 60% → 花
- 成績登録（偏差値のみ）: deviation ≥ 60 → 木、50-59 → 茂み、< 50 → 花
- 数値データなしの成績は植わらない

**枯れロジック（動的計算・DB変更なし）:**

- `rejected` 件数 + 期限切れ `assigned` 件数 = 枯れ数
- 枯れ数だけ古い順に植物が枯れて表示（WiltedTree / WiltedBush / WiltedFlower）
- 提出（submitted）にすると枯れが即回復

**アクセス:**

- 生徒: `/garden`（自分の森）
- 先生: `/students/[id]/garden`（担当生徒の森・閲覧のみ）
- `/students` 一覧の「森を見る」リンクから遷移
- 生徒ダッシュボードにミニプレビューカード（アイテム数・プログレスバー）あり

**グリッド:** 8×8 = 最大64アイテム、座標は `@@unique([studentId, x, y])`

## 主要ファイル詳細マップ

### レイアウト

| ファイル | 役割 | 備考 |
| --- | --- | --- |
| `src/app/(app)/layout.tsx` | 認証チェック + Sidebar/Header/BottomNav/Toaster を配置 | `max-w-7xl mx-auto` でコンテンツ幅制限 |
| `src/components/layout/sidebar.tsx` | デスクトップ左サイドバー | `hidden md:flex`、md=w-16(アイコンのみ)、lg=w-60(ラベルあり) |
| `src/components/layout/header.tsx` | ページタイトル表示ヘッダー | `PAGE_TITLES` 配列でパスからタイトル解決。モバイルはタイトル or "katekyo" 表示 |
| `src/components/layout/bottom-nav.tsx` | モバイル固定ボトムナビ | `md:hidden`、先生5項目・生徒5項目 |

### 各ページ（先生）

| ページ | パス | 特記事項 |
| --- | --- | --- |
| ダッシュボード | `/dashboard` | Suspense で各セクション並列ロード。TeacherSummaryCards / PendingHomeworksSection / TeacherUpcomingSection / HomeworkStatusSection / GradeTrendsSection |
| 生徒一覧 | `/students` | モバイル=カード、デスクトップ=テーブル。progressMap/gardenMap/problemMap で統計表示 |
| 宿題管理 | `/homework` | `submitted`を上部 BulkApproveSection で一括承認。`others`を下部に表示。モバイル=カード、デスクトップ=テーブル |
| 宿題作成 | `/homework/new` | CreateHomeworkForm でテンプレートピッカー実装（title/description を useState で制御） |
| 宿題テンプレート | `/homework/templates` | `HomeworkTemplate` モデルの CRUD。TemplateManager クライアントコンポーネント |
| 提出写真 | `/homework/photos` | `photoUrl IS NOT NULL` の宿題を2-4カラムグリッドで表示。生徒フィルター付き |
| 請求管理 | `/billing` | 月別ナビ（URL searchParams year/month）。`calcFee(durationMin, hourlyRate, travelExpense)` で金額計算。生徒別内訳 |
| カレンダー | `/calendar` | `CalendarView` クライアントコンポーネント。授業（Lesson）+テスト日（ExamEvent）。授業ログ（lessonLog）と費用（hourlyRate/travelExpense）フォーム |
| 成績管理 | `/grades` | URL `?type=mock` 等でサーバーサイドフィルタ |

### 各ページ（生徒）

| ページ | パス | 特記事項 |
| --- | --- | --- |
| ダッシュボード | `/dashboard` | StudentSummaryCards(3col) / StudentUpcomingExams / StudentUpcomingSection / StudentGardenPreview |
| 宿題 | `/homework` | active/submitted/approved に分けて表示。CancelSubmissionButton で提出取り消し |
| 成績 | `/grades` | Recharts グラフ。点数/偏差値切り替え。複数種別がある場合のみフィルタ表示 |
| 学習の森 | `/garden` | `garden-canvas.tsx` がアイソメトリックSVG描画。植物7種（tree/bush/flower/cherry/big_tree/bamboo/mushroom）+枯れ版 |
| 教材 | `/materials` | 担当先生の教材一覧（参照のみ） |

### 重要なモデルとフィールド

```typescript
// Lesson - 授業記録
Lesson {
  date, type("online"|"face"), durationMin
  notes          // 事前メモ
  lessonLog      // 授業後のログ（何を教えたか）
  hourlyRate     // 時給（円）
  travelExpense  // 交通費（円）。onlineなら0に強制
}

// HomeworkTemplate - 宿題テンプレート
HomeworkTemplate { id, teacherId, title, description, createdAt }

// GardenItem - 学習の森アイテム
GardenItemType = "tree" | "bush" | "flower" | "cherry" | "big_tree" | "bamboo" | "mushroom"
// bamboo: 満点(100%)または偏差値70+
// cherry: 90%以上または偏差値65+
// big_tree: 80%以上または偏差値60+ (DB上はtree扱い？ → garden-utils.ts参照)
// mushroom: 宿題承認時に約5%の確率でランダム出現
```

### 授業費用計算

```typescript
// src/app/(app)/billing/page.tsx に定義
function calcFee(durationMin, hourlyRate, travelExpense) {
  if (!hourlyRate && !travelExpense) return null
  const lessonFee = durationMin && hourlyRate ? Math.round((durationMin / 60) * hourlyRate) : 0
  return lessonFee + (travelExpense ?? 0)
}
// オンライン授業は actions.ts でサーバー側 effectiveTravelExpense = type === "online" ? 0 : travelExpense
```

### ナビゲーション構成

**先生サイドバー:** ダッシュボード / 生徒一覧 / 宿題管理 / 提出写真 / 宿題テンプレート / 成績管理 / カレンダー / 請求管理 / 科目タグ  
**生徒サイドバー:** ダッシュボード / 宿題 / 成績 / カレンダー / 教材 / 学習の森  
**先生ボトムナビ(5):** ホーム / 生徒 / 宿題 / 成績 / 予定  
**生徒ボトムナビ(5):** ホーム / 宿題 / 成績 / 予定 / 森

## UIの指針

- shadcn/ui のコンポーネントを積極的に活用する
- モバイル: 固定ボトムナビ（`md:hidden`）、デスクトップ: サイドバー（`hidden md:flex`）
- テーブルは `overflow-hidden overflow-x-auto` + `min-w-[Xpx]` でモバイル対応
- main の padding: `p-4 md:p-6 pb-20 md:pb-6`（ボトムナビ分の余白）
- 承認待ちの宿題はダッシュボード最上部にバッジ付きで表示
- 成績グラフは点数と偏差値を切り替えられるようにする
- ダッシュボードは先生・生徒で表示内容が異なる（下記参照）
  - 先生: 承認待ち宿題・生徒別宿題ステータス表・成績動向・今後7日の授業/期限
  - 生徒: 未完了/期限切れ/承認待ちカード・次のテストまでの日数・今後のテスト一覧・今後7日の授業/期限・学習の森プレビュー

### カレンダー（ExamEvent）

- 先生がカレンダーの日付をクリックしてテスト日（ExamEvent）を登録
- testType: `mock`（模試）/ `exam`（定期テスト）/ `quiz`（小テスト）/ `other`
- 生徒ダッシュボードの「次のテスト」カードと「今後のテスト」一覧に反映される
