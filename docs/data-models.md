# データモデル

定義元: `prisma/schema.prisma`

## モデル一覧

### User

```prisma
User {
  id            String
  name          String
  email         String   @unique
  password      String   # bcrypt ハッシュ
  role          Role     # "teacher" | "student" | "parent"
  lineUserId    String?  @unique  # LINE 連携後に設定
  meetLink      String?           # Google Meet 固定 URL（先生のみ使用）
  agreedToTermsAt DateTime?
  createdAt     DateTime

  # teacher relations
  students            Student[]         # role=teacher のみ（担当生徒）
  inviteTokens        InviteToken[]
  subjects            Subject[]
  homeworksGiven      Homework[]
  gradesGiven         GradeRecord[]
  lessonsGiven        Lesson[]
  materialsGiven      StudentMaterial[]
  examEventsGiven     ExamEvent[]
  monthlyPayments     MonthlyPayment[]

  # student relation
  studentProfile Student?          # role=student のみ

  # parent relations
  parentLinks        ParentStudent[]   # role=parent のみ（紐づけた生徒一覧）
  teacherParentLinks ParentStudent[]   # role=teacher のみ（自テナントの保護者リンク）
  parentInviteTokens ParentInviteToken[]

  lineLinkToken  LineLinkToken?
}
```

### Student

```prisma
Student {
  id                   String
  userId               String   @unique
  teacherId            String
  grade                String   # GRADE_OPTIONS の値（例: "中学1年"）
  gardenGeneration     Int      @default(1)  # 森が満開リセットされた世代数
  defaultHourlyRate    Int?     # 授業登録時のデフォルト時給
  defaultTravelExpense Int?     # 授業登録時のデフォルト交通費
  defaultDurationMin   Int?     # 授業登録時のデフォルト所要時間（分）
  defaultSubjectIds    String[] @default([])  # 授業登録時のデフォルト科目タグ
  createdAt            DateTime

  # Relations
  user        User
  teacher     User              @relation("TeacherStudents")
  homeworks   Homework[]
  grades      GradeRecord[]
  lessons     Lesson[]
  materials   StudentMaterial[]
  gardenItems GardenItem[]
  examEvents  ExamEvent[]
  monthlyPayments MonthlyPayment[]
  parentLinks          ParentStudent[]     # この生徒に紐づく保護者リンク
  parentInviteTokens   ParentInviteToken[] # この生徒向けに発行された招待トークン
}
```

### Homework

```prisma
Homework {
  id              String
  teacherId       String
  studentId       String
  title           String
  description     String?
  dueDate         DateTime
  status          HomeworkStatus  # assigned | submitted | approved | rejected
  subjectIds      String[]        # Subject.id の配列
  materialId      String?         # StudentMaterial.id
  requiresPhoto   Boolean         @default(false)  # 写真提出を必須にするか
  photoUrl        String?         # Supabase Storage の公開 URL
  studentNote     String?         # 生徒からのコメント
  difficultyRating Int?           # 難易度評価（1=かんたん 2=ふつう 3=むずかしい）
  teacherFeedback String?
  submittedAt     DateTime?
  reviewedAt      DateTime?
  createdAt       DateTime

  # Relations
  student  Student
  material StudentMaterial?
  events   HomeworkEvent[]
}
```

### HomeworkEvent（宿題やり取り履歴）

```prisma
HomeworkEvent {
  id         String
  homeworkId String
  eventType  HomeworkEventType  # submitted | approved | rejected
  actorName  String             # 操作者の表示名スナップショット
  note       String?            # 差し戻し時の理由など
  createdAt  DateTime

  # Relations
  homework Homework
  @@index([homeworkId])
}
```

### Lesson（授業）

```prisma
Lesson {
  id              String
  teacherId       String
  studentId       String
  date            DateTime
  type            LessonType  # online | offline
  durationMin     Int?        # 所要時間（分）
  notes           String?     # 事前メモ
  lessonLog       String?     # 授業後のログ（何を教えたか）
  lessonLogPublic Boolean     # 授業ログを生徒に公開するか
  subjectIds      String[]    # Subject.id の配列
  hourlyRate      Int?        # 時給（円）
  travelExpense   Int?        # 交通費（円）。online の場合は 0 に強制
  completedAt     DateTime?   # 完了確定日時。null = 未完了（請求対象外）
  qstashMessageId String?     # QStash メッセージ ID（授業前リマインダーキャンセル用）
  createdAt       DateTime
}
```

### GradeRecord（成績）

```prisma
GradeRecord {
  id            String
  teacherId     String
  studentId     String
  testName      String
  testType      TestType  # mock | exam | quiz | other
  date          DateTime
  subjectIds    String[]
  score         Int?
  maxScore      Int?
  rank          Int?
  totalStudents Int?
  deviation     Float?
  avgScore      Int?
  teacherRating Int?      # 主観評価（1–5）。現在 UI 非使用・廃止予定（列は残存）
  comment       String?
  createdAt     DateTime
}
```

### GardenItem（学習の森アイテム）

```prisma
GardenItem {
  id        String
  studentId String
  itemType  GardenItemType  # 下記 enum 参照
  x         Int             # 0–7（グリッド座標）
  y         Int             # 0–7
  createdAt DateTime

  @@unique([studentId, x, y])  # 同座標に2つ置けない
}
```

### StudentMaterial（生徒の使用教材）

```prisma
StudentMaterial {
  id         String
  studentId  String
  teacherId  String
  name       String
  note       String?
  subjectIds String[]  @default([])  # 紐づく科目タグ
  createdAt  DateTime

  # Relations（宿題から materialId で参照される）
  homeworks  Homework[]
}
```

### InviteToken（招待トークン）

```prisma
InviteToken {
  id        String
  teacherId String
  token     String   @unique
  name      String
  email     String?
  grade     String
  expiresAt DateTime  # 7日後
  usedAt    DateTime? # 使用済みの場合に記録
  createdAt DateTime
}
```

### LineLinkToken（LINE 連携トークン）

```prisma
LineLinkToken {
  id        String
  userId    String   @unique
  token     String   @unique  # 6桁数字（10分有効）
  expiresAt DateTime
  createdAt DateTime
}
```

### ParentStudent（保護者–生徒 中間テーブル）

```prisma
ParentStudent {
  id        String
  parentId  String
  studentId String
  teacherId String           # テナント分離用
  createdAt DateTime

  @@unique([parentId, studentId])
}
```

### ParentInviteToken（保護者招待トークン）

生徒招待の `InviteToken` とは構造が異なる（`studentId` を持つ）ため別テーブル。

```prisma
ParentInviteToken {
  id        String
  token     String    @unique @default(uuid())
  teacherId String
  studentId String
  email     String?   # 任意。特定メアドに招待したい場合のメモ
  usedAt    DateTime? # 使用済みの場合に記録
  expiresAt DateTime  # 7日後
  createdAt DateTime
}
```

### ExamEvent（テスト予定日）

```prisma
ExamEvent {
  id        String
  teacherId String
  studentId String
  name      String
  testType  TestType  # mock | exam | quiz | other
  date      DateTime
  endDate   DateTime?  # 試験期間の終了日（任意）
  createdAt DateTime
}
```

### Subject（科目タグ）

```prisma
Subject {
  id        String
  teacherId String
  name      String
  color     String?   # 成績グラフの線色。src/lib/subject-colors.ts のスウォッチから選択（null=未設定でローテーション色にフォールバック）
  createdAt DateTime

  @@unique([name, teacherId])
}
```

### MonthlyPayment（月次支払い記録）

```prisma
MonthlyPayment {
  id        String
  teacherId String
  studentId String
  year      Int
  month     Int
  dueDate   DateTime?  # 支払い期限（任意）。先生が任意の日付を設定できる
  paidAt    DateTime?  # 入金日。null = 未払い。markAsPaid で設定、markAsUnpaid で null に戻す
  createdAt DateTime

  @@unique([teacherId, studentId, year, month])
}
```

- レコードは「支払い期限設定」または「入金確認」どちらのタイミングでも作成される
- `paidAt != null` が入金済みの判定条件（レコード存在だけでは入金済みにならない）
- `dueDate` が設定されているレコードは `markAsUnpaid` 時に削除せず `paidAt: null` にリセットする

## Enum

```prisma
enum Role {
  teacher
  student
  parent
}

enum HomeworkStatus {
  assigned   # 未提出
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
  cherry    # 桜（90%以上 or 偏差値65+）
  big_tree  # 大木（80%以上 or 偏差値60+）
  bamboo    # 竹（満点 or 偏差値70+）
  mushroom  # キノコ（宿題承認時 ≈5% ランダム）
}
```

## データアクセス原則

- Prisma クエリには必ず `teacherId` または `studentId` の絞り込みを含める
- `findFirst({ where: { id } })` だけの取得は禁止（データ漏洩防止）
- `teacher` は自分の生徒のデータのみ参照・操作可能
- `student` は自分のデータのみ参照可能（Lesson 作成・削除不可）

## 学年選択肢

`src/lib/grades.ts` の `GRADE_OPTIONS` を使用。フリーテキスト入力不可。

## テスト種別

`src/lib/test-types.ts` の `TEST_TYPE_OPTIONS`（`[value, label][]`）と `TEST_TYPE_LABELS`（`Record<string, string>`）を使用。
値: `mock`（模試）/ `exam`（定期テスト）/ `quiz`（小テスト）/ `other`（その他）
