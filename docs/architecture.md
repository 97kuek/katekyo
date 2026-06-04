# アーキテクチャ

## ディレクトリ構成

```text
src/
├── app/
│   ├── (auth)/           # login, register, invite/[token], parent-invite/[token]
│   ├── (legal)/          # privacy, terms
│   └── (app)/            # 認証済みページ全般
│       ├── layout.tsx        # Sidebar/Header/BottomNav/Toaster
│       ├── dashboard/
│       ├── parent-invite/
│       │   └── create/       # 生徒が保護者招待リンクを生成
│       ├── students/
│       │   ├── invite/       # 招待トークン生成
│       │   ├── invites/      # 招待トークン管理
│       │   └── [id]/         # grades/, materials/, garden/, invite-parent/, parents/
│       ├── homework/
│       │   ├── new/
│       │   └── [id]/         # submit/, review/, edit/
│       ├── grades/
│       │   ├── new/
│       │   └── [id]/         # edit/
│       ├── calendar/
│       ├── billing/
│       ├── garden/
│       ├── materials/
│       ├── profile/
│       ├── settings/
│       └── help/
├── components/
│   ├── ui/               # shadcn/ui 基本コンポーネント
│   ├── homework/         # StatusBadge 等
│   └── layout/           # header.tsx, sidebar.tsx, bottom-nav.tsx
├── lib/
│   ├── auth.ts               # NextAuth 設定
│   ├── db.ts                 # Prisma クライアント（シングルトン）
│   ├── garden.ts             # plantGardenItem ヘルパー
│   ├── garden-utils.ts       # scoreToGardenItemType 純粋関数
│   ├── grades.ts             # GRADE_OPTIONS 定数
│   ├── line.ts               # LINE Messaging API ヘルパー
│   ├── qstash.ts             # Upstash QStash ヘルパー（授業リマインダー）
│   ├── queries.ts            # React.cache() 共通クエリ
│   ├── supabase-storage.ts   # Supabase Storage ヘルパー
│   ├── test-types.ts         # TEST_TYPE_LABELS / TEST_TYPE_OPTIONS
│   ├── date-utils.ts         # relativeDeadline / deadlineColorClass
│   ├── changelog.ts          # 変更ログデータ定義
│   └── utils.ts              # clsx/twMerge ユーティリティ
└── api/
    ├── auth/[...nextauth]/   # NextAuth ハンドラ
    ├── cron/
    │   ├── cleanup-homework/ # 宿題・招待トークン削除（毎日 Vercel Cron）
    │   ├── line-daily/       # LINE 週次通知（毎週日曜 Vercel Cron）
    │   ├── line-monthly/     # LINE 月次通知（手動実行のみ・Cron 無効）
    │   └── annual-cleanup/   # 年次データ削除（手動実行のみ・Cron 無効）
    ├── line/
    │   ├── webhook/          # LINE Bot Webhook（メッセージ受信・連携処理）
    │   ├── setup-rich-menus/ # リッチメニュー作成（初回一回限り）
    │   └── apply-rich-menus/ # 既存ユーザーへのリッチメニュー一括適用
    └── webhooks/
        └── lesson-reminder/  # QStash Webhook: 授業前リマインダー送信
prisma/
└── schema.prisma
```

## レイアウトコンポーネント

| ファイル | 役割 | 備考 |
| --- | --- | --- |
| `src/app/(app)/layout.tsx` | 認証チェック + 全レイアウト配置 | 外側コンテナ `fixed inset-0`（キーボード表示でレイアウト崩れ防止） |
| `src/components/layout/page-content.tsx` | ページ遷移アニメーション | Client Component。`usePathname()` を `key` にして `animate-page-in` を再生 |
| `src/components/layout/sidebar.tsx` | デスクトップ左サイドバー | `hidden md:flex`、md=w-16（アイコンのみ）、lg=w-60（ラベルあり） |
| `src/components/layout/header.tsx` | ページタイトルヘッダー | `PAGE_TITLES` 配列でパスからタイトル解決。モバイルはタイトル or "katekyo" |
| `src/components/layout/bottom-nav.tsx` | モバイル固定ボトムナビ | `md:hidden`、先生6項目・生徒5項目・保護者4項目。アクティブアイコンは scale(1.1) |

## ページ一覧（保護者）

| ページ | パス | 主要コンポーネント・特記事項 |
| --- | --- | --- |
| ダッシュボード | `/dashboard` | ParentStudentList: 担当生徒カード（宿題進捗・次回授業・直近成績）。1人の場合は直接サマリー |
| 成績 | `/grades` | ParentGradesPage: 生徒セレクタ付き、グラフ・一覧（閲覧のみ） |
| カレンダー | `/calendar` | 担当生徒全員の授業・宿題・テスト予定（閲覧のみ） |
| 請求 | `/billing` | ParentBillingPage: 担当生徒の完了授業・費用・入金ステータス一覧（閲覧のみ） |
| 宿題 | `/homework` | ParentHomeworkPage: 生徒セレクタ付き、宿題一覧（閲覧のみ） |
| 宿題詳細 | `/homework/[id]` | 詳細・提出写真・フィードバック閲覧。操作ボタンは非表示 |
| 学習の森 | `/garden` | ParentGardenPage: 生徒セレクタ付き、GardenCanvas（閲覧のみ） |
| 設定 | `/settings` | 名前・パスワード変更・アカウント削除（削除は保護者のみ表示） |
| 使い方ガイド | `/help` | ParentHelp: 保護者向け操作説明 |
| 保護者招待 | `/parent-invite/create` | 生徒から保護者を招待するリンク生成 |

## ページ一覧（先生）

| ページ | パス | 主要コンポーネント・特記事項 |
| --- | --- | --- |
| ダッシュボード | `/dashboard` | Suspense 並列ロード。UncompletedLessonsSection / TeacherSummaryCards / PendingHomeworksSection / TeacherUpcomingSection / HomeworkStatusSection / GradeTrendsSection |
| 生徒一覧 | `/students` | モバイル=カード、デスクトップ=テーブル。progressMap/gardenMap/problemMap |
| 宿題管理 | `/homework` | BulkApproveSection（submitted を一括承認）。モバイル=カード、デスクトップ=テーブル |
| 宿題作成 | `/homework/new` | CreateHomeworkForm。写真提出必須オプション（requiresPhoto） |
| 請求管理 | `/billing` | 月別ナビ（year/month searchParams）。calcFee() で金額計算。生徒別内訳。支払い期限設定・入金確認 UI。loading.tsx でスケルトン表示 |
| カレンダー | `/calendar` | CalendarView クライアントコンポーネント。授業（Lesson）+ テスト日（ExamEvent） |
| 成績管理 | `/grades` | `?type=mock` 等サーバーサイドフィルタ |
| 保護者管理 | `/students/[id]/parents` | 紐づけ済み保護者一覧・リンク解除。未使用の招待トークン表示 |
| 保護者招待 | `/students/[id]/invite-parent` | 保護者招待リンク生成（7日有効）・コピー |
| プロフィール | `/profile` | 表示名・パスワード変更（両ロール共通） |
| 設定 | `/settings` | LINE連携 / Meet URL / 科目タグ管理 |
| 使い方ガイド | `/help` | 操作説明・ホーム画面追加手順 |

## ページ一覧（生徒）

| ページ | パス | 主要コンポーネント・特記事項 |
| --- | --- | --- |
| ダッシュボード | `/dashboard` | StudentSummaryCards(3col) / StudentUpcomingExams / StudentUpcomingSection / StudentGardenPreview |
| 宿題 | `/homework` | active/submitted/approved 分類。CancelSubmissionButton |
| 宿題提出 | `/homework/[id]/submit` | SubmitForm。写真は代表ページを1枚。requiresPhoto=true の場合は写真必須 |
| 成績 | `/grades` | Recharts グラフ。点数/偏差値切り替え。複数種別のみフィルタ表示 |
| 学習の森 | `/garden` | garden-canvas.tsx がアイソメトリック SVG 描画。植物7種+枯れ版 |
| 教材 | `/materials` | 担当先生に登録してもらった教材一覧（科目タグ表示・参照のみ） |
| カレンダー | `/calendar` | 授業・テスト予定閲覧。オンライン授業から Meet 参加 |
| プロフィール | `/profile` | 表示名・パスワード変更（両ロール共通） |
| 設定 | `/settings` | LINE連携 |
| 使い方ガイド | `/help` | 操作説明・ホーム画面追加手順 |
| 保護者招待 | `/parent-invite/create` | 保護者招待リンクを生成（ダッシュボードからも誘導） |

## ナビゲーション構成

**先生サイドバー:** ダッシュボード / 生徒一覧 / 宿題管理 / 成績管理 / カレンダー / 請求管理

**生徒サイドバー:** ダッシュボード / 宿題 / 成績 / カレンダー / 教材 / 学習の森

**保護者サイドバー:** ダッシュボード / 成績 / カレンダー / 請求

**先生ボトムナビ(6):** ホーム / 生徒 / 宿題 / 予定 / 請求 / 成績

**生徒ボトムナビ(5):** ホーム / 宿題 / 成績 / 予定 / 森

**保護者ボトムナビ(4):** ホーム / 成績 / 予定 / 請求

**設定（サイドバー下部・全ロール共通）:** 設定 / 使い方ガイド

## レスポンシブ設計

| ブレークポイント | レイアウト |
| --- | --- |
| `< 640px` (mobile) | ボトムナビ、カード表示、ヘッダーにページタイトル表示 |
| `640px–767px` (sm) | ボトムナビ継続、ボタンにラベル表示、サマリーカード4列 |
| `768px–1023px` (md) | サイドバー表示（アイコンのみ w-16）、テーブル表示、ボトムナビ消える |
| `1024px+` (lg) | サイドバーにラベル表示（w-60） |

- テーブルは `overflow-hidden overflow-x-auto` + `min-w-[Xpx]` でモバイル対応
- main の padding: `p-4 md:p-6 pb-20 md:pb-6`（ボトムナビ分の余白）
