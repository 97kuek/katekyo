# アーキテクチャ

## ディレクトリ構成

```text
src/
├── app/
│   ├── (auth)/           # login, register, invite/[token]
│   └── (app)/            # 認証済みページ全般
│       ├── layout.tsx        # Sidebar/Header/BottomNav/Toaster
│       ├── dashboard/
│       ├── students/
│       │   └── [id]/         # grades/, materials/, garden/
│       ├── homework/
│       │   ├── new/
│       │   ├── photos/
│       │   ├── templates/
│       │   └── [id]/         # submit/, review/, edit/
│       ├── grades/
│       ├── calendar/
│       ├── billing/
│       ├── subjects/
│       ├── garden/
│       └── materials/
├── components/
│   ├── ui/               # shadcn/ui 基本コンポーネント
│   ├── homework/         # StatusBadge 等
│   └── layout/           # header.tsx, sidebar.tsx, bottom-nav.tsx
├── lib/
│   ├── auth.ts               # NextAuth 設定
│   ├── db.ts                 # Prisma クライアント（シングルトン）
│   ├── garden.ts             # plantGardenItem Server Action
│   ├── garden-utils.ts       # scoreToGardenItemType 純粋関数
│   ├── grades.ts             # GRADE_OPTIONS 定数
│   ├── queries.ts            # React.cache() 共通クエリ
│   ├── supabase-storage.ts   # Supabase Storage ヘルパー
│   ├── test-types.ts         # TEST_TYPE_LABELS / TEST_TYPE_OPTIONS
│   └── date-utils.ts         # relativeDeadline / deadlineColorClass
└── api/
    └── cron/
        └── cleanup-homework/  # Vercel Cron エンドポイント
prisma/
└── schema.prisma
```

## レイアウトコンポーネント

| ファイル | 役割 | 備考 |
| --- | --- | --- |
| `src/app/(app)/layout.tsx` | 認証チェック + 全レイアウト配置 | `max-w-7xl mx-auto` でコンテンツ幅制限 |
| `src/components/layout/sidebar.tsx` | デスクトップ左サイドバー | `hidden md:flex`、md=w-16（アイコンのみ）、lg=w-60（ラベルあり） |
| `src/components/layout/header.tsx` | ページタイトルヘッダー | `PAGE_TITLES` 配列でパスからタイトル解決。モバイルはタイトル or "katekyo" |
| `src/components/layout/bottom-nav.tsx` | モバイル固定ボトムナビ | `md:hidden`、先生5項目・生徒5項目 |

## ページ一覧（先生）

| ページ | パス | 主要コンポーネント・特記事項 |
| --- | --- | --- |
| ダッシュボード | `/dashboard` | Suspense 並列ロード。TeacherSummaryCards / PendingHomeworksSection / TeacherUpcomingSection / HomeworkStatusSection / GradeTrendsSection |
| 生徒一覧 | `/students` | モバイル=カード、デスクトップ=テーブル。progressMap/gardenMap/problemMap |
| 宿題管理 | `/homework` | BulkApproveSection（submitted を一括承認）。モバイル=カード、デスクトップ=テーブル |
| 宿題作成 | `/homework/new` | CreateHomeworkForm。テンプレートピッカー（title/description を useState 制御） |
| 宿題テンプレート | `/homework/templates` | HomeworkTemplate CRUD。TemplateManager クライアントコンポーネント |
| 提出写真 | `/homework/photos` | photoUrl IS NOT NULL の宿題を 2〜4 カラムグリッド表示。生徒フィルター |
| 請求管理 | `/billing` | 月別ナビ（year/month searchParams）。calcFee() で金額計算。生徒別内訳 |
| カレンダー | `/calendar` | CalendarView クライアントコンポーネント。授業（Lesson）+ テスト日（ExamEvent） |
| 成績管理 | `/grades` | `?type=mock` 等サーバーサイドフィルタ |

## ページ一覧（生徒）

| ページ | パス | 主要コンポーネント・特記事項 |
| --- | --- | --- |
| ダッシュボード | `/dashboard` | StudentSummaryCards(3col) / StudentUpcomingExams / StudentUpcomingSection / StudentGardenPreview |
| 宿題 | `/homework` | active/submitted/approved 分類。CancelSubmissionButton |
| 成績 | `/grades` | Recharts グラフ。点数/偏差値切り替え。複数種別のみフィルタ表示 |
| 学習の森 | `/garden` | garden-canvas.tsx がアイソメトリック SVG 描画。植物7種+枯れ版 |
| 教材 | `/materials` | 担当先生の教材一覧（参照のみ） |

## ナビゲーション構成

**先生サイドバー:** ダッシュボード / 生徒一覧 / 宿題管理 / 提出写真 / 宿題テンプレート / 成績管理 / カレンダー / 請求管理 / 科目タグ

**生徒サイドバー:** ダッシュボード / 宿題 / 成績 / カレンダー / 教材 / 学習の森

**先生ボトムナビ(5):** ホーム / 生徒 / 宿題 / 成績 / 予定

**生徒ボトムナビ(5):** ホーム / 宿題 / 成績 / 予定 / 森

## レスポンシブ設計

| ブレークポイント | レイアウト |
| --- | --- |
| `< 640px` (mobile) | ボトムナビ、カード表示、ヘッダーにページタイトル表示 |
| `640px–767px` (sm) | ボトムナビ継続、ボタンにラベル表示、サマリーカード4列 |
| `768px–1023px` (md) | サイドバー表示（アイコンのみ w-16）、テーブル表示、ボトムナビ消える |
| `1024px+` (lg) | サイドバーにラベル表示（w-60） |

- テーブルは `overflow-hidden overflow-x-auto` + `min-w-[Xpx]` でモバイル対応
- main の padding: `p-4 md:p-6 pb-20 md:pb-6`（ボトムナビ分の余白）
