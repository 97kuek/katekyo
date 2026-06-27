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
│   ├── ui/               # 基本コンポーネント（button, card, input, label,
│   │                     #   textarea, select, swipeable-row, sticky-form-actions 等）
│   ├── homework/         # StatusBadge 等
│   └── layout/           # header.tsx, sidebar.tsx, bottom-nav.tsx,
│                         #   page-content.tsx, pull-to-refresh.tsx
├── lib/
│   ├── haptic.ts             # navigator.vibrate() ラッパー（タップ/成功/エラー/スナップ）
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
    │   ├── lesson-reminder/  # オンライン授業10分前の Meet リンク配信（5分毎ポーリング・冪等セーフティネット。GET/POST、Bearer CRON_SECRET 認証。Hobby は QStash Schedule、Pro は Vercel Cron で起動）
    │   ├── line-monthly/     # LINE 月次通知（手動実行のみ・Cron 無効）
    │   └── annual-cleanup/   # 年次データ削除（手動実行のみ・Cron 無効）
    ├── line/
    │   ├── webhook/          # LINE Bot Webhook（メッセージ受信・連携処理）
    │   ├── setup-rich-menus/ # リッチメニュー作成（初回一回限り）
    │   └── apply-rich-menus/ # 既存ユーザーへのリッチメニュー一括適用
    ├── qstash/
    │   └── setup-reminder-schedule/ # 授業リマインダー用 QStash Schedule を作成（初回一回限り・Hobby向け）
    └── webhooks/
        └── lesson-reminder/  # QStash Webhook: 授業前リマインダー送信（cron と reminderSentAt で冪等共存）
prisma/
└── schema.prisma
```

## レイアウトコンポーネント

| ファイル | 役割 | 備考 |
| --- | --- | --- |
| `src/app/(app)/layout.tsx` | 認証チェック + 全レイアウト配置 | 外側コンテナ `fixed inset-0`（キーボード表示でレイアウト崩れ防止） |
| `src/components/layout/page-content.tsx` | ページ遷移アニメーション + スクロール復帰 | Client Component。`usePathname()` を `key` にして `animate-page-in` を再生。遷移時に `<main>` を先頭へスクロール |
| `src/components/layout/pull-to-refresh.tsx` | プルダウン更新 | Client Component。`<main>` 最上部から下に引くと `router.refresh()`。デスクトップでは無効 |
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
| プロフィール | `/profile` | `/settings` へリダイレクト（表示名・パスワード変更は設定ページに統合） |
| 設定 | `/settings` | 名前・パスワード変更 / LINE連携 / Meet URL / 科目タグ管理（`/subjects` はここへリダイレクト） |
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
| プロフィール | `/profile` | `/settings` へリダイレクト（表示名・パスワード変更は設定ページに統合） |
| 設定 | `/settings` | 名前・パスワード変更 / LINE連携 |
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
- main の padding: `p-4 md:p-6 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-6`（ボトムナビ + iOS ホームインジケーター分の余白）

## CSR / SSR / SSG の使い分け

### 基本方針

Next.js App Router では **Server Component がデフォルト**。`"use client"` は必要最小限のコンポーネントにのみ付与する。

| レンダリング方式 | 使う場面 | 例 |
|---|---|---|
| **SSR（Server Component）** | DB アクセス・認証・初期データ取得 | `page.tsx`、`layout.tsx`（ほぼ全ページ） |
| **CSR（Client Component）** | インタラクション・ブラウザ API・状態管理 | フォーム・フィルター・チャート・スワイプ |
| **SSG（Static）** | 変化しないコンテンツ | 現状未使用（全データが動的テナントのため） |

### `"use client"` を付ける条件（どれか1つ以上を満たす場合のみ）

```
✅ useState / useReducer / useRef を使う
✅ useEffect / useLayoutEffect を使う
✅ useActionState / useTransition / useFormStatus を使う
✅ useRouter / usePathname / useSearchParams を使う
✅ ブラウザ API（navigator, window, document）を使う
✅ イベントハンドラ（onClick, onChange 等）が必要
✅ Recharts などクライアント専用ライブラリを使う
```

### よくある誤用パターン（禁止）

```typescript
// ❌ インタラクションがないのに "use client" を付ける
"use client"
export function StaticCard({ title }: { title: string }) {
  return <div>{title}</div>  // ← Server Component で書ける
}

// ✅ 正しくは Server Component のまま
export function StaticCard({ title }: { title: string }) {
  return <div>{title}</div>
}
```

### データフェッチの流れ

```
page.tsx (Server Component)
  └── async/await + db.xxx.findMany()   ← サーバー側でデータ取得
        └── <ClientComponent data={data} />  ← シリアライズ可能なデータを props で渡す
              └── useState で UI 状態管理
```

`page.tsx` から `db` を直接 import してよい。クライアントコンポーネントに db や auth を渡す必要はなく、Server Actions 経由でサーバー側処理を行う。

### Suspense / loading.tsx

各ルートに `loading.tsx` を配置してストリーミング SSR を有効化する。スケルトン UI は `loading.tsx` に書く。

```
/(app)/homework/
  ├── page.tsx        ← データフェッチ（async）
  └── loading.tsx     ← スケルトン（即時表示）
```

`page.tsx` 内で並列データフェッチが必要な場合は `<Suspense>` で個別に囲む（ダッシュボードの各セクション参照）。

---

## サーバー/クライアント分離

### 責務の境界

| 場所 | やること | やらないこと |
|---|---|---|
| **Server Component** | DB クエリ、auth()、秘密情報の使用 | useState、ブラウザ API |
| **Server Action** | 認証チェック、Zod 検証、DB 書き込み | DOM 操作、クライアント状態 |
| **Client Component** | UI 状態管理、イベント処理、Server Action の呼び出し | db の直接 import、auth() の呼び出し |

### クライアントコンポーネントへの禁止事項

```typescript
// ❌ 禁止: クライアントコンポーネントが db を直接触る
"use client"
import { db } from "@/lib/db"  // ← これは絶対禁止

// ❌ 禁止: クライアントコンポーネントが auth() を呼ぶ
"use client"
import { auth } from "@/lib/auth"
const session = await auth()  // ← サーバー側の処理
```

### Server Action の呼び出しパターン

```typescript
// パターン1: form action（最もシンプル）
<form action={createHomework}>
  <input name="title" />
  <button type="submit">作成</button>
</form>

// パターン2: useActionState（エラー表示・ローディング状態が必要な場合）
const [state, action, isPending] = useActionState(serverAction, { error: "" })
<form action={action}>
  {state.error && <p>{state.error}</p>}
</form>

// パターン3: useTransition（ボタンクリック等、フォームでない場合）
const [isPending, startTransition] = useTransition()
<button onClick={() => startTransition(() => deleteAction(id))}>削除</button>
```

### Server Action のセキュリティチェックリスト

実装順序を必ず守る:

```typescript
"use server"

export async function someAction(formData: FormData) {
  // 1. 認証確認
  const session = await auth()
  if (!session) return { error: "認証が必要です" }

  // 2. ロール確認（必要な場合）
  if (session.user.role !== "teacher") return { error: "権限がありません" }

  // 3. Zod バリデーション
  const parsed = schema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  // 4. テナント絞り込みを含む DB クエリ
  const record = await db.homework.findFirst({
    where: { id: parsed.data.id, teacherId: session.user.id },
  })
  if (!record) return { error: "見つかりません" }

  // 5. 書き込み
  await db.homework.update({ where: { id: parsed.data.id }, data: { ... } })
}
```

---

## API 設計

### Route Handler vs Server Action の使い分け

| 方式 | 使う場面 | 命名規則 |
|---|---|---|
| **Server Action** | フォーム送信・ボタン操作（アプリ内部の CRUD） | 動詞（RPC スタイル）: `createHomework`, `deleteLesson` |
| **Route Handler** | 外部サービスの Webhook・Cron・CSV ダウンロード | 名詞+リソース: `/api/billing/export`, `/api/line/webhook` |

Server Actions は REST API ではなく **RPC（Remote Procedure Call）** として設計されているため、動詞命名が正しい。`createHomework` のような名前は Next.js の慣例通り。

Route Handlers は外部からアクセスされるため REST の原則に従い、パスは名詞ベース・HTTP メソッドで操作を表現する。

### Route Handler 一覧

| パス | メソッド | 用途 | 認証 |
|---|---|---|---|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth | – |
| `/api/billing/export` | GET | 請求 CSV ダウンロード | teacher セッション |
| `/api/cron/cleanup-homework` | GET | 期限切れデータ削除 | `CRON_SECRET` |
| `/api/cron/line-daily` | GET | LINE 週次通知 | `CRON_SECRET` |
| `/api/cron/lesson-reminder` | GET/POST | 授業リマインダー（冪等） | `CRON_SECRET` |
| `/api/line/webhook` | POST | LINE Bot 受信 | LINE 署名検証 |
| `/api/webhooks/lesson-reminder` | POST | QStash からの授業通知 | QStash 署名検証 |

---

## テスト戦略

### テスト構成

| 種別 | ツール | 対象 | ファイル場所 |
|---|---|---|---|
| **ユニットテスト** | Vitest | 純粋関数・Zod スキーマ | `src/lib/*.test.ts` |
| **E2E テスト** | Playwright | UI フロー・ページ遷移 | `tools/*.spec.ts` |

DB・外部 API に依存するコード（Server Actions・Route Handlers）はユニットテストではなく E2E テストでカバーする。

### ユニットテスト対象の選定基準

```
✅ テスト対象: 純粋関数（入力 → 出力が決定論的）
  - src/lib/garden/utils.ts  → scoreToGardenItemType
  - src/lib/date-utils.ts    → relativeDeadline, deadlineColorClass, formatDate
  - src/lib/validation.test.ts → Zod スキーマのバリデーションルール

❌ ユニットテスト対象外: DB・外部 API 依存
  - src/lib/garden/actions.ts  → DB クエリあり → E2E でカバー
  - src/lib/line.ts            → LINE API → E2E or 手動確認
  - src/app/**/actions.ts      → auth + DB → E2E でカバー
```

### コマンド

```bash
npm test                  # ユニットテスト一回実行（CI 向け）
npm run test:watch        # ウォッチモード（開発中）
npm run test:coverage     # カバレッジレポート生成
npx playwright test       # E2E テスト実行
```

### 新しいユニットテストを書く場所

純粋関数を `src/lib/` に追加した場合、同ディレクトリに `*.test.ts` を作成する。

```
src/lib/
  ├── garden/
  │   ├── utils.ts
  │   └── utils.test.ts    ← ここ
  ├── date-utils.ts
  ├── date-utils.test.ts   ← ここ
  └── validation.test.ts   ← Zod スキーマのテスト
```

---

## モバイル操作・safe-area

- **safe-area 対応**: `viewport` に `viewportFit: "cover"` を設定。ボトムナビは `pb-[env(safe-area-inset-bottom)]`、main の下余白も safe-area を加味（iPhone のホームインジケーターに被らない）
- **スワイプ操作**（`components/ui/swipeable-row.tsx`）: 宿題一覧・成績一覧のモバイルカードを左スワイプで編集/削除を露出。露出トレイは**ニュートラル背景（`bg-muted`）に統一**し、編集=`text-muted-foreground`／削除=`text-destructive` のアイコン+極小ラベルで色のみ差別化（パステル薄塗りは使わない）。左端まで振り切ると `onFullSwipe`（削除）を実行し、その間は赤一色スラブ＋「離して削除」を表示（opacity の二段階アームは廃止）。Pointer Events + `touch-action: pan-y`、`haptic` で触覚フィードバック。閉じている間は右端に控えめなシェブロンでスワイプ可能を示唆
- **スティッキー送信ボタン**（`components/ui/sticky-form-actions.tsx`）: 長いフォームの送信ボタンをモバイルで画面下部（ボトムナビの上）に固定。同じ高さのスペーサーで最後の入力欄が隠れないようにする。デスクトップでは通常フロー
- **プルダウン更新**（`components/layout/pull-to-refresh.tsx`）: `<main>` 最上部から引くと `router.refresh()`
- **ボトムナビ**: アクティブ項目は上部にインジケーターバー + アイコン拡大。タップで `active:opacity-60`
