# Historical: 初期仕様書

> この文書は保護者、LINE通知、現在の画面・データモデルを含まない初期構想であり、現行仕様ではない。
> 現行の正本は [ドキュメントガイド](../README.md)、[ユースケース](../usecases.md)、[機能要件](../requirements.md) を参照する。

# 家庭教師管理アプリ 仕様書（旧）

## 1. プロジェクト概要

家庭教師と生徒の間で宿題の進捗・成績を管理するWebアプリ。
将来的に複数の先生・生徒が利用できる小規模プラットフォームを目指す。

- **ターゲット**: 個人の家庭教師（複数人が利用可能な設計）
- **ユーザー**: 先生・生徒（保護者は対象外）
- **通知機能**: なし（ダッシュボードで確認する設計）

---

## 2. ユーザーロール

| ロール | 説明 |
|---|---|
| `teacher` | 生徒の管理・宿題の作成と承認・成績の記録を行う |
| `student` | 宿題の完了報告・自分の成績確認を行う |

先生間のデータは完全に分離される（マルチテナント構造）。

---

## 3. 認証・招待フロー

### 先生の登録
- `/register` でメール・パスワードで自己登録
- ロールは `teacher` として作成

### 生徒の招待
1. 先生が管理画面から生徒情報（名前・メール・学年）を入力
2. システムが招待トークン（UUID）を生成し、DBに保存
3. 先生が招待URL `/invite/[token]` をコピーして生徒に渡す
4. 生徒がURLを開き、パスワードを設定してアカウント有効化
5. 生徒は招待した先生に自動的に紐付けられる

### 招待トークンの仕様
- 有効期限: 7日間
- 使い切り（使用後は無効化）
- 期限切れ・使用済みの場合はエラー画面を表示

---

## 4. データモデル

### User
```
id          String   @id (UUID)
email       String   @unique
name        String
role        Role     (teacher | student)
password    String   (hashed)
createdAt   DateTime
```

### Student（先生と生徒の紐付け）
```
id          String   @id (UUID)
userId      String   @unique → User
teacherId   String   → User (role=teacher)
grade       String   (例: "中学2年", "高校3年")
createdAt   DateTime
```

### InviteToken
```
id          String   @id (UUID)
token       String   @unique
teacherId   String   → User
email       String
name        String
grade       String
usedAt      DateTime?
expiresAt   DateTime
createdAt   DateTime
```

### Subject（科目タグ）
```
id          String   @id (UUID)
name        String   (例: "数学", "英語")
teacherId   String   → User
```

### Homework（宿題）
```
id              String          @id (UUID)
studentId       String          → Student
teacherId       String          → User
title           String
description     String?
dueDate         DateTime
subjectIds      String[]        (科目タグのID)
status          HomeworkStatus  (assigned | submitted | approved | rejected)
studentNote     String?         (生徒の完了報告コメント)
teacherFeedback String?         (先生のフィードバック)
submittedAt     DateTime?
reviewedAt      DateTime?
createdAt       DateTime
```

#### HomeworkStatus の遷移
```
assigned
  └─ submitted    （生徒が完了報告）
       ├─ approved    （先生が承認）
       └─ rejected    （先生が差し戻し → 生徒が再提出可能）
```

### GradeRecord（成績記録）
```
id              String   @id (UUID)
studentId       String   → Student
teacherId       String   → User
testName        String   (例: "第3回定期テスト")
date            DateTime
subjectIds      String[] (科目タグのID)
score           Int?     (得点)
maxScore        Int?     (満点)
rank            Int?     (全体順位)
totalStudents   Int?     (母数、順位と対でセット)
deviation       Float?   (偏差値)
teacherRating   Int?     (主観評価 1〜5)
comment         String?  (先生のコメント)
createdAt       DateTime
```

---

## 5. 画面一覧

### 共通
| パス | 説明 |
|---|---|
| `/` | トップ（未ログイン時はランディング、ログイン済みはダッシュボードにリダイレクト）|
| `/login` | ログイン |
| `/register` | 先生の新規登録 |
| `/invite/[token]` | 生徒の招待URL・パスワード設定 |

### 先生側
| パス | 説明 |
|---|---|
| `/dashboard` | 全生徒の進捗サマリー・承認待ち宿題一覧 |
| `/students` | 生徒一覧 |
| `/students/invite` | 生徒招待フォーム |
| `/students/[id]` | 生徒詳細（宿題・成績タブ切替） |
| `/students/[id]/homework/new` | 宿題作成 |
| `/students/[id]/grades/new` | 成績記録 |
| `/subjects` | 科目タグ管理 |

### 生徒側
| パス | 説明 |
|---|---|
| `/dashboard` | 未完了の宿題一覧・直近の成績サマリー |
| `/homework` | 宿題一覧（ステータスフィルタ付き） |
| `/homework/[id]` | 宿題詳細・完了報告フォーム |
| `/grades` | 成績一覧・推移グラフ |

---

## 6. 主要UIコンポーネント

### ダッシュボード（先生）
- 承認待ち宿題のカード一覧（優先度高く最上部に表示）
- 生徒ごとの宿題完了率バー
- 最近追加した成績記録

### 生徒詳細ページ
- **宿題タブ**: 宿題の一覧・新規作成ボタン・各宿題の承認/差し戻しアクション
- **成績タブ**: 成績の一覧テーブル＋科目別推移グラフ（Recharts）

### 成績グラフ
- 横軸: 日付
- 縦軸: 点数 or 偏差値（切替可能）
- 科目タグでフィルタリング可能

---

## 7. API設計（Next.js Route Handlers）

### 認証
| メソッド | パス | 説明 |
|---|---|---|
| POST | `/api/auth/register` | 先生の新規登録 |
| POST | `/api/auth/[...nextauth]` | NextAuth.js |

### 招待
| メソッド | パス | 説明 |
|---|---|---|
| POST | `/api/invite` | 招待トークン生成 |
| GET | `/api/invite/[token]` | トークン情報取得 |
| POST | `/api/invite/[token]/accept` | 生徒アカウント作成 |

### 生徒
| メソッド | パス | 説明 |
|---|---|---|
| GET | `/api/students` | 生徒一覧（先生のみ） |
| GET | `/api/students/[id]` | 生徒詳細 |

### 宿題
| メソッド | パス | 説明 |
|---|---|---|
| GET | `/api/homework` | 一覧（ロール・ステータスで絞込） |
| POST | `/api/homework` | 宿題作成（先生のみ） |
| GET | `/api/homework/[id]` | 詳細 |
| PATCH | `/api/homework/[id]` | 更新（完了報告 or 承認/差し戻し） |

### 成績
| メソッド | パス | 説明 |
|---|---|---|
| GET | `/api/grades?studentId=` | 成績一覧 |
| POST | `/api/grades` | 成績記録（先生のみ） |
| PATCH | `/api/grades/[id]` | 成績編集 |
| DELETE | `/api/grades/[id]` | 成績削除 |

### 科目タグ
| メソッド | パス | 説明 |
|---|---|---|
| GET | `/api/subjects` | 科目一覧 |
| POST | `/api/subjects` | 科目作成 |
| DELETE | `/api/subjects/[id]` | 科目削除 |

---

## 8. 認可ルール

- 先生は自分の生徒のデータのみ操作可能
- 生徒は自分のデータのみ参照可能（成績・宿題の作成・削除は不可）
- 全APIでセッション確認 → 未認証は401、権限なしは403を返す

---

## 9. 技術スタック

| カテゴリ | 選定技術 |
|---|---|
| フレームワーク | Next.js 15 (App Router) |
| 言語 | TypeScript |
| UI | shadcn/ui + Tailwind CSS |
| ORM | Prisma |
| DB | Supabase (PostgreSQL) ※無料枠 |
| 認証 | NextAuth.js v5 |
| グラフ | Recharts |
| デプロイ | Vercel（フロント） + Supabase（DB） |
| バリデーション | Zod |

---

## 10. 将来拡張の考慮事項（実装しない）

- 保護者ロールの追加
- メール通知・リマインダー
- 塾・スクール単位のグループ管理
- 宿題へのファイル添付
- 支払い管理
