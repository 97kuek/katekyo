# デザインシステム

katekyo アプリのデザイントークン・コンポーネント規則。`src/app/globals.css` がすべてのトークン定義元。

## カラートークン

**CSS トークンクラスのみ使用。ハードコードカラー（`text-amber-600`, `bg-blue-100` 等）は禁止。**

### ライトモード

| Tailwind クラス | CSS 変数 / OKLCH 値 | 役割 |
|---|---|---|
| `bg-background` | `--background` `oklch(1 0 0)` | ページ背景 |
| `text-foreground` | `--foreground` `oklch(0.183 0.007 261)` | 本文・見出し |
| `bg-card` | `--card` `oklch(1 0 0)` | カード背景 |
| `bg-muted` | `--muted` `oklch(0.963 0.006 255)` | サブ背景・外側ラッパー |
| `text-muted-foreground` | `--muted-foreground` `oklch(0.487 0.028 233)` | 補助テキスト |
| `bg-primary` / `text-primary` | `--primary` `oklch(0.50 0.115 147)` | 渋い緑（主要アクション） |
| `text-destructive` | `--destructive` `oklch(0.537 0.238 21)` | エラー・削除 |
| `text-warning` | `--warning` `oklch(0.735 0.183 69)` | 警告（amber 系） |
| `text-warning-foreground` | `--warning-foreground` `oklch(0.541 0.133 63)` | 警告背景上テキスト |
| `border-border` | `--border` | 一般境界線 |
| `border-input` | `--input` | フォーム入力境界線 |

### セマンティック使用例

```tsx
// 警告バナー
<div className="rounded-lg border border-warning/30 bg-warning/10 text-warning-foreground">

// アクセントバッジ
<span className="bg-primary/10 text-primary border border-primary/20">

// エラーテキスト
<p className="text-destructive">

// 標準カード
<div className="rounded-lg border bg-card p-4">
```

### コントラスト規則

- `bg-primary` / `bg-destructive` のような塗り背景では、必ず対応する `*-foreground` を使う
- `bg-primary/10` などの淡色背景に同じ色相の `text-primary` を重ねない。本文は `text-foreground`、意味色は枠線またはアイコンで示す
- 警告背景上の本文は `text-warning-foreground` を使う
- ダークモードを含め、通常文字は WCAG AA のコントラスト比 4.5:1 を目標とする

## アイコン

- 画面、ボタン、バッジ、空状態、通知文ではUnicode絵文字を使わない
- UIアイコンは `lucide-react` に統一し、学習の森には `TreePine`、`Trees`、`Sprout`、`Flower2`、`Leaf` などテーマに沿うものを使う
- アイコンだけのボタンには `aria-label` または視覚的に同等のラベルを必須とする
- 装飾アイコンには `aria-hidden` を付け、読み上げ内容を重複させない

## タイポグラフィ

- 本文はOS標準のシステムフォントを優先し、Apple端末ではSan Francisco、日本語はヒラギノ系へ自然にフォールバックする
- 外部Webフォントを初期表示の必須リソースにしない。文字取得待ちや日本語と欧文の不自然な混在を避ける
- 大見出しは負のtracking、本文はほぼ0とし、`font-optical-sizing: auto` を有効にする

## ボーダー半径スケール

`@theme inline` で定義（`globals.css`）。

| クラス | 値 | 主な用途 |
|---|---|---|
| `rounded-sm` | 4px | マイクロ UI |
| `rounded-lg` | 8px | **標準カード・モーダル・フォーム入力（全カード面で統一）** |
| `rounded-full` | 9999px | ボタン（全て）・バッジ・チップ |

> カード面（`bg-card` のコンテナ・`<Card>` コンポーネント・モーダル・空状態）は **すべて `rounded-lg`** に統一。`rounded-xl` / `rounded-2xl` / `rounded-3xl` はコンテンツカードには使わない（装飾ロゴアイコンの箱のみ例外）。

## ボタンコンポーネント

`src/components/ui/button.tsx`（shadcn + base-ui + cva）。**全ボタンは `rounded-full` ピル型。**

### バリアント

| variant | 見た目 | 主な用途 |
|---|---|---|
| `default` | 緑背景・白文字 | 主要アクション（フォーム送信等） |
| `outline` | 枠線・透明背景 | 二次アクション・ナビゲーション |
| `ghost` | 透明・ホバーで薄背景 | テーブル内操作・補助 |
| `secondary` | muted 背景 | 状態トグル |
| `destructive` | 赤背景 | 削除・破壊的操作 |
| `link` | テキストリンク風 | インラインリンク |

### サイズ

| size | 高さ | 用途 |
|---|---|---|
| `lg` | 44px | 目立つ CTA |
| `default` | モバイル44px / デスクトップ40px | 標準 |
| `sm` | モバイル44px / デスクトップ32px | コンパクト |
| `xs` | モバイル44px / デスクトップ28px | テーブル内・狭い場所 |
| `icon-lg` / `icon` / `icon-sm` / `icon-xs` | モバイル44px、デスクトップは44/40/32/28px | アイコンのみボタン |

### 使用パターン

```tsx
import { Button, buttonVariants } from "@/components/ui/button"

// 標準
<Button>追加</Button>
<Button variant="outline" size="sm">編集</Button>
<Button variant="ghost" size="xs">削除</Button>
<Button variant="ghost" size="icon-sm"><ChevronLeftIcon /></Button>

// <a> タグにボタン見た目を付ける
<a href="/xxx" className={buttonVariants({ variant: "outline", size: "sm" })}>
  リンク
</a>

// Server Action フォーム
<form action={someAction}>
  <Button type="submit" disabled={isPending} size="sm">
    {isPending ? "送信中..." : "送信"}
  </Button>
</form>
```

生 `<button>` タグが許可される場面: カレンダーの日付セル、色見本、セグメント、評価選択など、標準ボタンとは異なる形そのものに意味がある専用コントロールと、共通 `Button` 実装内部のみ。それ以外は `<Button>` を使う。

## フォーム入力部品

標準フォームの入力欄は共通コンポーネントを使う。**生の `<input>` / `<textarea>` / `<select>` を独自スタイルで使わない**（高さ・角丸・フォントのばらつき・iOS のフォーカス時ズームを防ぐため）。

| コンポーネント | ファイル | 仕様 |
|---|---|---|
| `Input` | `ui/input.tsx` | `h-11 rounded-lg border-input`、`text-base md:text-sm`（モバイル 16px で iOS 自動ズーム回避） |
| `Textarea` | `ui/textarea.tsx` | Input と同じ枠線・フォーカス。`field-sizing: content` で自動拡張 |
| `Select` | `ui/select.tsx` | ネイティブ `<select>` を Input と同じ見た目でラップ。右端に `ChevronDown` |
| `FormField` | `ui/form-field.tsx` | 必須／任意、入力形式、例、フォーカス移動後の具体的な即時エラーを一体表示 |
| `FormProgress` | `ui/form-progress.tsx` | 長いフォームの必須項目数と完了率を自動計算 |
| `PendingStatus` | `ui/pending-status.tsx` | 送信待ちを時間に応じてスピナー／長時間バーへ切り替え |

- フィルターバー等の**コンパクトな操作系**（`h-8`/`h-9`）は別系統。フォーム入力には使わない
- 送信ボタンは長いフォームではモバイルで `StickyFormActions` により画面下部に固定（[architecture.md](architecture.md#モバイル操作safe-area) 参照）
- 必須／任意を色だけで区別せず、必ず文字で表示する
- 大文字・小文字、全角・半角、ハイフンや単位の要否が迷いやすい項目は入力欄の直下に明記する
- メールアドレスは全角英数字を半角へ正規化し、小文字として保存・照合する。パスワードは大文字・小文字と全角・半角を区別する
- サーバーエラーは理由と修正方法を同じメッセージで示し、成功後は次に確認できる画面または反映先を案内する

## 状態表示と確認操作

- 空状態は `EmptyState` を使い、アイコン・見出し・説明・CTAの余白を統一する
- フォームの成功・エラーは `FormMessage` を使い、意味色は背景と同色の文字ではなくアイコンと枠線で示す
- 一覧内の削除・解除確認は `InlineConfirmAction` を使い、「操作を開始 → 内容確認 → 実行」の2段階にする
- `window.confirm` は画面やブラウザで見た目が変わるため使用しない

## レイアウト・ビューポート

**外側コンテナ** (`src/app/(app)/layout.tsx`): `fixed inset-0 flex flex-col bg-muted overflow-hidden`

- `fixed inset-0`: iOS/Android でソフトウェアキーボード表示時にビューポートが縮小しない
- `overflow-hidden`: コンテンツがコンテナ外にはみ出さない
- スクロールは内側の `<main>`（`overflow-y-auto`）が担当

**main**: モバイル下余白は `--mobile-nav-clearance + 1rem`、デスクトップは `md:pb-6`

- `--mobile-nav-clearance` はガラス面の高さと iOS safe-area を一元管理し、本文・固定CTA・宿題の主要操作で共有する

**html/body** (`globals.css`): `overscroll-behavior: none` — iOS の elastic bounce を無効化

## UXアニメーション

### ページ遷移

`src/components/layout/page-content.tsx`（Client Component）が `usePathname()` を `key` に使い、ルート変更時は空間的な根拠のないスライドを避け、短いクロスフェードだけを再生する。

```css
/* globals.css */
@keyframes page-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
.animate-page-in {
  animation: page-in 0.18s ease-out both;
}
```

### ボタンのプレスフィードバック

`button.tsx` のベースクラス:

| 状態 | 効果 |
| --- | --- |
| `:active` | `translateY(+1px)` + `scale(0.97)`（`active:translate-y-px active:scale-[0.97]`） |
| `:hover` | 背景色・テキスト色だけを短くフェード |
| `:focus-visible` | 3px リング（`focus-visible:ring-3`） |
| `:disabled` | opacity 50% + `pointer-events-none` |

`active:not-aria-[haspopup]` 限定のため、ドロップダウントリガーにはプレスアニメーションが付かない。

### 一覧の操作ボタン

- 編集・削除・詳細はスワイプやジェスチャーに隠さず、カードまたは行に明示的なボタンとして表示する
- 同じ操作は画面サイズにかかわらず同じラベル・バリアント・順序で配置する
- 削除は `InlineConfirmAction` を使い、「削除」ボタンの後に確認する2段階操作とする
- 一覧内の操作は `xs`、モバイルカード下部の操作は `sm` で統一する

### ナビゲーション

- **Sidebar**: 色・背景・不透明度だけを短く切り替える。非アクティブ項目はクリック時に `scale(0.97)` で沈む
- **BottomNav**: コンテンツ層から浮く単一の `liquid-glass-chrome` 面を使い、ガラス面を重ねない。選択項目は不透明なprimaryのアイコン背景で示す
- Liquid Glass風の半透明素材はナビ・ツールバー・シートなどの機能層に限定し、コンテンツカードには使わない
- `prefers-reduced-transparency` では不透明背景、`prefers-contrast: more` では高コントラストの枠線へフォールバックする
- `prefers-reduced-motion` では反復アニメーションと移動を止め、グラフを初期状態から静的描画し、プルダウン更新を無効化する
- 「学習」「その他」のような集約タブは、配下画面でも選択状態を維持し現在地を見失わせない

### ローディング（Skeleton）

ページは `loading.tsx` で `animate-pulse` スケルトンを表示し、コンテンツロード後に `animate-page-in` でフェードイン。これにより「ちらつき」なしに遷移できる。

リンク遷移とフォーム送信は待ち時間に応じて表示を変える。

- 1秒未満: 表示しない（短い処理で点滅させない）
- 1〜4秒: コンパクトなスピナーと処理内容
- 4秒以上: 上端の進捗バーと「処理を続けています」の説明
- 進捗率を取得できない処理で、架空のパーセント値を表示しない

## 情報設計と操作密度

業務情報を削除せず、初期表示の優先順位を次の3層で統一する。

1. 今やること（確認、提出、入金確認など）
2. 現在の状態（期限、次回予定、最新結果など）
3. 履歴・明細・設定（必要時に開示）

- 1画面で強調する主要CTAは原則1つとする
- 二次情報は詳細開示へ置けるが、編集・削除などの操作は「その他」やジェスチャーに隠さず明示する
- 破壊操作は通常の視線上へ常設せず、確認を含む2段階操作にする
- 一覧は主情報1行、補助情報1行、状態を基本とする。デスクトップ表は原則5列以下とし、残りは詳細へ移す
- 編集・削除はジェスチャーや「その他」に隠さず、ラベル付きボタンから到達可能にする
- フィルターは検索を先頭に置き、モバイルでは「絞り込み（適用数）」へまとめる
- 検索・絞り込み後は一致件数を表示し、カードと表で主要項目の順序をそろえて比較しやすくする
- 完了履歴、請求明細、高度な設定、アカウント操作は初期状態を閉じる

### モバイルナビゲーション

下部ナビゲーションは5項目以内とし、日常利用する機能だけを直接配置する。

| ロール | 項目 |
| --- | --- |
| 先生 | ホーム / 生徒 / 宿題 / 予定 / その他 |
| 生徒 | ホーム / 宿題 / 予定 / 成績 / その他 |
| 保護者 | ホーム / 予定 / 成績 / 請求 / その他 |

画面上の用語は「カレンダー」ではなく、利用目的を表す「予定」に統一する。

### 保護者の生徒コンテキスト

- 複数のお子さまが紐づく場合、宿題・予定・成績・請求・学習の森で共通の切替UIを使う
- 選択中の生徒は端末内で保持し、別ページへ移動しても同じ生徒を優先する
- 複数生徒の情報を同時表示する場合は、各項目に必ず生徒名を表示する
