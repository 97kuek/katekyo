# データモデル

定義元: `prisma/schema.prisma`

## テナント分離の原則

このアプリは **1先生 = 1テナント** のマルチテナント構造。すべてのデータは `teacherId`（= `session.user.id`）で完全分離される。

- Prisma は `DATABASE_URL`（service role 相当）で接続するため、PostgreSQL RLS はバイパスされる。テナント分離はアプリケーション層の責任。
- Prisma クエリには **必ず** `teacherId` または `studentId`（= 確認済み自分の studentId）の絞り込みを含める。
- `findFirst({ where: { id } })` のみのクエリは**禁止**（テナント漏洩防止）。

---

## モデル一覧

### User

ロールに関わらず全ユーザーを格納する単一テーブル。

```prisma
User {
  id              String    @id @default(uuid())
  email           String    @unique
  name            String
  role            Role                        # "teacher" | "student" | "parent"
  password        String                      # bcrypt ハッシュ（コスト係数 12）
  lineUserId      String?   @unique           # LINE 連携後に設定。null = 未連携
  meetLink        String?                     # Google Meet 固定 URL（先生のみ使用）
  agreedToTermsAt DateTime? @db.Timestamptz(3)
  createdAt       DateTime  @default(now()) @db.Timestamptz(3)

  # teacher relations
  students            Student[]
  inviteTokens        InviteToken[]
  subjects            Subject[]
  homeworksGiven      Homework[]
  gradesGiven         GradeRecord[]
  lessonsGiven        Lesson[]
  materialsGiven      StudentMaterial[]
  examEventsGiven     ExamEvent[]
  monthlyPayments     MonthlyPayment[]

  # student relation
  studentProfile Student?                     # role=student のみ存在

  # parent relations
  parentLinks        ParentStudent[]           # role=parent のみ（紐づけた生徒一覧）
  teacherParentLinks ParentStudent[]           # role=teacher のみ（自テナントの保護者リンク）
  parentInviteTokens ParentInviteToken[]

  lineLinkToken  LineLinkToken?
}
```

**注意点:**
- `role` によって使われるリレーションが異なる。teacher は `students`/`homeworksGiven` など、student は `studentProfile`、parent は `parentLinks` を主に使う。
- `password` は bcrypt ハッシュのみ保存。生パスワードをどこにも記録しない。

### Google認証IDとプロフィールアクセス

`AuthIdentity` はGoogleの不変IDであるOIDC `sub` を保持し、`IdentityAccess` がアプリ内の `User` プロフィールへの許可を表す。Googleのemailは表示・監査補助に限り、アカウント結合キーには使わない。

- `AuthIdentity(provider, providerSubject)` は一意
- `IdentityAccess(identityId, userId)` は一意で、`isDefault` がログイン直後のプロフィールを示す
- `kind=guardian` は保護者による生徒プロフィール代理利用のために予約し、現段階では付与しない
- `IdentityLinkIntent` は明示連携用の10分トークンをハッシュで保持する
- `AuthAuditLog` は連携・解除・Googleログイン成功を追記型で記録する

---

### Student

`User(role=student)` のプロフィール拡張テーブル。1:1 対応。

```prisma
Student {
  id                   String   @id @default(uuid())
  userId               String   @unique                 # User.id（1:1）
  teacherId            String                           # テナントキー（必須）
  grade                String                           # GRADE_OPTIONS の値（例: "中学1年"）
  gardenGeneration     Int      @default(1)             # 学習の森が満開リセットされた世代数
  defaultHourlyRate    Int?                             # 授業登録時のデフォルト時給（円）
  defaultTravelExpense Int?                             # 授業登録時のデフォルト交通費（円）
  defaultDurationMin   Int?                             # 授業登録時のデフォルト所要時間（分）
  defaultSubjectIds    String[] @default([])            # 授業登録時のデフォルト科目 Subject.id[]
  createdAt            DateTime @default(now()) @db.Timestamptz(3)

  @@index([teacherId])
}
```

---

### Homework（宿題）

```prisma
Homework {
  id               String         @id @default(uuid())
  teacherId        String                               # テナントキー
  studentId        String
  title            String
  description      String?
  dueDate          DateTime       @db.Timestamptz(3)
  subjectIds       String[]                             # Subject.id の配列
  materialId       String?                              # StudentMaterial.id
  status           HomeworkStatus @default(assigned)    # 状態遷移は下記参照
  studentNote      String?                              # 生徒からの提出コメント
  difficultyRating Int?                                 # 難易度評価（1=かんたん 2=ふつう 3=むずかしい）
  teacherFeedback  String?                              # 先生からのフィードバック
  requiresPhoto    Boolean        @default(false)       # 写真提出を必須にするか
  photoUrl         String?                              # Supabase Storage のprivate object path（旧データは公開URL）
  submittedAt      DateTime?      @db.Timestamptz(3)
  reviewedAt       DateTime?      @db.Timestamptz(3)
  feedbackSeenAt   DateTime?      @db.Timestamptz(3)   # 生徒がフィードバックを確認した日時
  createdAt        DateTime       @default(now()) @db.Timestamptz(3)

  @@index([teacherId])
  @@index([studentId, status])
  @@index([teacherId, status])
  @@index([dueDate])
}
```

**状態遷移:**

```
assigned ──[生徒が提出]──▶ submitted ──[先生が承認]──▶ approved
    ▲                          │
    │                     [先生が差し戻し]
    │                          ▼
    └──[生徒が提出取り消し]── rejected
```

- `assigned → submitted`: `submitHomework`（生徒のみ）
- `submitted → approved / rejected`: `reviewHomework`（先生のみ）
- `submitted → assigned`: `cancelSubmission`（生徒のみ、submitted 状態のみ）
- `rejected → submitted`: `submitHomework` で再提出可能

**feedbackSeenAt の用途:**
`reviewHomework` 実行時にリセット（`null`）され、生徒が詳細ページを開くと `markFeedbackSeen` でセットされる。ダッシュボードの未読バッジ表示に使う。

---

### HomeworkEvent（宿題やり取り履歴）

```prisma
HomeworkEvent {
  id         String            @id @default(uuid())
  homeworkId String
  eventType  HomeworkEventType                          # submitted | approved | rejected
  actorName  String                                     # 操作者の表示名スナップショット（User.name のコピー）
  note       String?                                    # 差し戻し時のコメントなど
  createdAt  DateTime          @default(now()) @db.Timestamptz(3)

  @@index([homeworkId])
}
```

**注意:** `actorName` はユーザー名変更後も履歴が崩れないよう、作成時点のスナップショットを保存する。

---

### Lesson（授業）

```prisma
Lesson {
  id              String     @id @default(uuid())
  teacherId       String                               # テナントキー
  studentId       String
  date            DateTime   @db.Timestamptz(3)        # 授業の開始日時（JST で入力 → UTC 保存）
  durationMin     Int?                                 # 所要時間（分）
  type            LessonType @default(online)          # online | offline
  notes           String?                              # 事前メモ（先生のみ閲覧）
  lessonLog       String?                              # 授業後のログ（何を教えたか）
  lessonLogPublic Boolean    @default(false)           # 授業ログを生徒に公開するか
  lessonLogSeenAt DateTime?  @db.Timestamptz(3)        # 生徒が授業ログを確認した日時
  subjectIds      String[]   @default([])              # Subject.id の配列
  hourlyRate      Int?                                 # 時給（円）
  travelExpense   Int?                                 # 交通費（円）。online の場合は 0 に強制
  completedAt     DateTime?  @db.Timestamptz(3)        # 完了確定日時。null = 未完了（請求対象外）
  qstashMessageId String?                              # QStash メッセージ ID（リマインダーキャンセル用）
  reminderSentAt  DateTime?  @db.Timestamptz(3)        # リマインダー配信済み時刻（二重送信防止）
  createdAt       DateTime   @default(now()) @db.Timestamptz(3)

  @@index([teacherId])
  @@index([studentId])
  @@index([teacherId, date])
  @@index([studentId, date])
}
```

**請求対象の条件:** `completedAt IS NOT NULL`。`/api/billing/export` および請求ページで使われる。

---

### GradeRecord（成績）

```prisma
GradeRecord {
  id            String   @id @default(uuid())
  teacherId     String                               # テナントキー
  studentId     String
  testName      String
  testType      TestType @default(other)             # mock | exam | quiz | other
  date          DateTime @db.Timestamptz(3)
  subjectIds    String[]
  score         Int?                                 # 得点
  maxScore      Int?                                 # 満点
  rank          Int?                                 # 順位
  totalStudents Int?                                 # 受験者数
  deviation     Float?                               # 偏差値
  avgScore      Int?                                 # 平均点
  teacherRating Int?                                 # 主観評価（1–5）※現在 UI 非使用・廃止予定（列は残存）
  comment       String?
  gardenEvaluationVersion Int @default(0)         # 0=移行前、1=追跡中、2=世代リセットで収穫済み
  createdAt     DateTime @default(now()) @db.Timestamptz(3)

  gardenItem GardenItem?                         # 成績から育った植物（最大1件）

  @@index([teacherId])
  @@index([studentId])
  @@index([teacherId, testType])
  @@index([date])
}
```

**GardenItem への連携:** 模試は偏差値、その他は得点率を優先して植物を判定する。`GardenItem.sourceGradeId` で元の成績を追跡し、編集時の再評価と削除時の連動を保証する。既存の由来不明な植物は `sourceGradeId=null` のまま保持する。

---

### ExamEvent（テスト予定日）

```prisma
ExamEvent {
  id        String    @id @default(uuid())
  teacherId String                                   # テナントキー
  studentId String
  name      String
  testType  TestType  @default(exam)
  date      DateTime  @db.Timestamptz(3)             # 試験開始日
  endDate   DateTime? @db.Timestamptz(3)             # 試験期間の終了日（任意）
  createdAt DateTime  @default(now()) @db.Timestamptz(3)

  @@index([teacherId])
  @@index([studentId])
  @@index([date])
  @@index([teacherId, date])
}
```

---

### GardenItem（学習の森アイテム）

```prisma
GardenItem {
  id        String         @id @default(uuid())
  studentId String
  itemType  GardenItemType
  x         Int                                      # 0–7（グリッド座標）
  y         Int                                      # 0–7
  sourceGradeId String? @unique                      # 成績由来の場合のGradeRecord.id
  createdAt DateTime       @default(now()) @db.Timestamptz(3)

  @@unique([studentId, x, y])                        # 同座標に2つ置けない
  @@index([studentId])
}
```

**アイテム付与ロジック（`src/lib/garden/`）:**
- 宿題承認時: `plantForHomeworkApproval` を呼ぶ。差し戻し歴または期限後提出があれば付与せず、それ以外は通常植物（5回ごとに大木）
- 成績登録時: 模試は偏差値、その他は得点率を優先してアイテムランクを決める
- グリッド満杯（64マス）で `gardenGeneration` をインクリメントし全アイテムをリセット

---

### StudentMaterial（生徒の使用教材）

```prisma
StudentMaterial {
  id         String   @id @default(uuid())
  studentId  String
  teacherId  String                                   # テナントキー
  name       String
  note       String?
  subjectIds String[] @default([])                   # 紐づく科目タグ
  createdAt  DateTime @default(now()) @db.Timestamptz(3)

  homeworks  Homework[]                               # この教材を参照している宿題

  @@index([studentId])
  @@index([teacherId])
}
```

---

### Subject（科目タグ）

```prisma
Subject {
  id        String   @id @default(uuid())
  teacherId String                                   # テナントキー
  name      String
  color     String?                                  # 成績グラフの線色。src/lib/subject-colors.ts のスウォッチから選択（null = ローテーション色）
  createdAt DateTime @default(now()) @db.Timestamptz(3)

  @@unique([name, teacherId])
  @@index([teacherId])
}
```

`Homework.subjectIds`・`Lesson.subjectIds`・`GradeRecord.subjectIds` などは `Subject.id` の UUID 配列として格納する（PostgreSQL `TEXT[]`）。JOINではなくアプリ側でルックアップする設計。

---

### InviteToken（生徒招待トークン）

```prisma
InviteToken {
  id        String    @id @default(uuid())
  teacherId String
  token     String    @unique @default(uuid())       # URL に埋め込む UUID トークン
  name      String                                   # 招待する生徒の名前（事前入力用）
  email     String?                                  # 任意。特定メアドに制限したい場合のメモ
  grade     String                                   # GRADE_OPTIONS の値（事前入力用）
  usedAt    DateTime?                                # 使用済みの場合に記録
  expiresAt DateTime                                 # 発行から7日後
  createdAt DateTime  @default(now()) @db.Timestamptz(3)

  @@index([teacherId])
  @@index([expiresAt])                               # cron によるクリーンアップ用
}
```

---

### ParentInviteToken（保護者招待トークン）

生徒招待の `InviteToken` とは構造が異なる（`studentId` を持つ）ため別テーブル。

```prisma
ParentInviteToken {
  id        String    @id @default(uuid())
  teacherId String
  studentId String                                   # 招待先の生徒
  token     String    @unique @default(uuid())
  email     String?                                  # 任意。特定メアドに招待したい場合のメモ
  usedAt    DateTime?
  expiresAt DateTime                                 # 発行から7日後
  createdAt DateTime  @default(now()) @db.Timestamptz(3)

  @@index([token])
  @@index([studentId])
  @@index([teacherId])
}
```

---

### ParentStudent（保護者–生徒 中間テーブル）

```prisma
ParentStudent {
  id        String   @id @default(uuid())
  parentId  String                                   # User.id (role=parent)
  studentId String                                   # Student.id
  teacherId String                                   # テナントキー（権限確認用）
  createdAt DateTime @default(now()) @db.Timestamptz(3)

  @@unique([parentId, studentId])
  @@index([parentId])
  @@index([studentId])
  @@index([teacherId])
}
```

**保護者招待フロー:**
1. 先生 or 生徒が `ParentInviteToken` を発行
2. 保護者がトークン URL を開く
3. 未登録 → `acceptParentInvite`: User(role=parent) 作成 + ParentStudent 作成をトランザクションで実行
4. 登録済み → `linkExistingParent`: ParentStudent レコードを追加するだけ

---

### LineLinkToken（LINE 連携トークン）

```prisma
LineLinkToken {
  id        String   @id @default(uuid())
  userId    String   @unique
  token     String   @unique                         # CSPRNG 12桁hex（10分有効）
  expiresAt DateTime @db.Timestamptz(3)
  createdAt DateTime @default(now()) @db.Timestamptz(3)

  @@index([token])
}
```

---

### MonthlyPayment（月次支払い記録）

```prisma
MonthlyPayment {
  id        String    @id @default(uuid())
  teacherId String
  studentId String
  year      Int
  month     Int
  dueDate   DateTime? @db.Timestamptz(3)            # 支払い期限（任意）
  paidAt    DateTime? @db.Timestamptz(3)            # 入金日。null = 未払い
  createdAt DateTime  @default(now()) @db.Timestamptz(3)

  @@unique([teacherId, studentId, year, month])
  @@index([teacherId])
  @@index([studentId])
}
```

**ビジネスロジック:**
- レコードは「支払い期限設定」または「入金確認」どちらのタイミングでも作成される
- `paidAt != null` が入金済みの判定条件（レコード存在だけでは入金済みにならない）
- `markAsUnpaid` 時: `dueDate` が設定されている場合は `paidAt: null` にリセット、ない場合はレコード削除
- `setPaymentDueDate` で期限クリア（空文字送信）かつ未払いの場合もレコード削除

---

## Enum

```prisma
enum Role {
  teacher
  student
  parent
}

enum HomeworkStatus {
  assigned   # 未提出（初期値）
  submitted  # 提出済み（先生承認待ち）
  approved   # 承認済み
  rejected   # 差し戻し
}

enum LessonType {
  online
  offline
}

enum TestType {
  mock   # 模試
  exam   # 定期テスト
  quiz   # 小テスト
  other  # その他
}

enum GardenItemType {
  tree      # 通常の木
  bush      # 茂み
  flower    # 花
  cherry    # 桜（高得点 or 偏差値65+）
  big_tree  # 大木（好成績 or 偏差値60+）
  bamboo    # 竹（満点 or 偏差値70+）
  mushroom  # キノコ（宿題承認時 ≈5% ランダム）
}

enum HomeworkEventType {
  submitted
  approved
  rejected
}
```

---

## インデックス設計方針

- テナントキー（`teacherId`）は単独インデックス必須（管理画面の一覧取得に多用）
- 複合インデックスは「よく一緒に使われる絞り込み条件」に追加:
  - `Homework(studentId, status)`: 生徒が自分の宿題を status で絞る
  - `Homework(teacherId, status)`: 先生が未提出・提出済みを絞る
  - `Lesson(teacherId, date)`: カレンダー表示（先生視点）
  - `Lesson(studentId, date)`: カレンダー表示（生徒視点）
  - `ExamEvent(teacherId, date)`: カレンダーへの試験予定表示
  - `GradeRecord(teacherId, testType)`: テスト種別フィルタ
- `expiresAt` インデックス（`InviteToken`）: cron でのバッチ削除用

---

## データアクセス原則

```typescript
// ✅ 正しい: teacherId でテナント境界を保証
const homework = await db.homework.findFirst({
  where: { id, teacherId: session.user.id },
})

// ✅ 正しい: studentId が自分のものであることを事前確認してから
const student = await db.student.findUnique({ where: { userId: session.user.id } })
const homework = await db.homework.findFirst({
  where: { id, studentId: student.id },
})

// ❌ 禁止: id だけのクエリは別テナントのデータを取得できてしまう
const homework = await db.homework.findFirst({ where: { id } })
```

**N+1 防止のパターン:**
- 一覧取得時は `include` / `select` でリレーションをまとめて取得する
- 一括承認 (`bulkApproveHomework`) など複数レコードを処理する場合は `findMany` でまとめて取得し、`updateMany` / `createMany` でまとめて更新する

---

## 定数

- **学年選択肢**: `src/lib/grades.ts` の `GRADE_OPTIONS`（フリーテキスト入力不可）
- **テスト種別**: `src/lib/test-types.ts` の `TEST_TYPE_OPTIONS`（`[value, label][]`）と `TEST_TYPE_LABELS`（`Record<string, string>`）
