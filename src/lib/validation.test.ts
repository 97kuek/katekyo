/**
 * Server Action で使われる Zod バリデーション規則のテスト。
 * スキーマは各 actions.ts にインラインで定義されているため、
 * ここでは同等のスキーマを宣言してエッジケースを検証する。
 */
import { describe, it, expect } from "vitest"
import { z } from "zod"
import { GRADE_OPTIONS } from "./grades"

// --- createHomework スキーマ相当 ---
const createHomeworkSchema = z.object({
  studentId: z.string().uuid(),
  title: z.string().min(1, "タイトルを入力してください"),
  dueDate: z.string().min(1, "期限を設定してください"),
})

// --- submitHomework スキーマ相当 ---
const submitHomeworkSchema = z.object({
  id: z.string().min(1),
  note: z.string().optional(),
  difficultyRating: z.coerce.number().int().min(1).max(3).optional(),
})

// --- createLesson スキーマ相当 ---
const createLessonSchema = z.object({
  studentId: z.string().min(1, "生徒を選択してください"),
  date: z.string().min(1, "日付を入力してください"),
  time: z.string().min(1, "時刻を入力してください"),
  type: z.enum(["online", "offline"]),
  repeatWeeks: z.string().optional(),
})

// --- resetStudentPassword スキーマ相当 ---
const resetPasswordSchema = z.object({
  studentId: z.string().min(1),
  password: z.string().min(8, "パスワードは8文字以上にしてください"),
})

// --- TestType スキーマ相当 ---
const TEST_TYPES = ["mock", "exam", "quiz", "other"] as const
const testTypeSchema = z.enum(TEST_TYPES).default("other")

describe("createHomeworkSchema", () => {
  it("正常なデータはパースを通過する", () => {
    const result = createHomeworkSchema.safeParse({
      studentId: "550e8400-e29b-41d4-a716-446655440000",
      title: "数学ドリル p.10-15",
      dueDate: "2024-01-20",
    })
    expect(result.success).toBe(true)
  })

  it("studentId が UUID でない場合はエラー", () => {
    const result = createHomeworkSchema.safeParse({
      studentId: "not-a-uuid",
      title: "数学ドリル",
      dueDate: "2024-01-20",
    })
    expect(result.success).toBe(false)
  })

  it("title が空文字の場合はエラー", () => {
    const result = createHomeworkSchema.safeParse({
      studentId: "550e8400-e29b-41d4-a716-446655440000",
      title: "",
      dueDate: "2024-01-20",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("タイトルを入力してください")
    }
  })

  it("dueDate が空文字の場合はエラー", () => {
    const result = createHomeworkSchema.safeParse({
      studentId: "550e8400-e29b-41d4-a716-446655440000",
      title: "数学ドリル",
      dueDate: "",
    })
    expect(result.success).toBe(false)
  })
})

describe("submitHomeworkSchema", () => {
  it("note と difficultyRating は省略可能", () => {
    const result = submitHomeworkSchema.safeParse({ id: "abc" })
    expect(result.success).toBe(true)
  })

  it("difficultyRating は 1–3 のみ許可", () => {
    expect(submitHomeworkSchema.safeParse({ id: "abc", difficultyRating: "1" }).success).toBe(true)
    expect(submitHomeworkSchema.safeParse({ id: "abc", difficultyRating: "3" }).success).toBe(true)
    expect(submitHomeworkSchema.safeParse({ id: "abc", difficultyRating: "0" }).success).toBe(false)
    expect(submitHomeworkSchema.safeParse({ id: "abc", difficultyRating: "4" }).success).toBe(false)
  })

  it("difficultyRating に文字列数字を渡しても coerce で変換される", () => {
    const result = submitHomeworkSchema.safeParse({ id: "abc", difficultyRating: "2" })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.difficultyRating).toBe(2)
  })
})

describe("createLessonSchema", () => {
  it("online/offline のみ type として許可", () => {
    expect(createLessonSchema.safeParse({ studentId: "s", date: "2024-01-20", time: "10:00", type: "online" }).success).toBe(true)
    expect(createLessonSchema.safeParse({ studentId: "s", date: "2024-01-20", time: "10:00", type: "offline" }).success).toBe(true)
    expect(createLessonSchema.safeParse({ studentId: "s", date: "2024-01-20", time: "10:00", type: "hybrid" }).success).toBe(false)
  })

  it("repeatWeeks は省略可能", () => {
    const result = createLessonSchema.safeParse({
      studentId: "s",
      date: "2024-01-20",
      time: "10:00",
      type: "online",
    })
    expect(result.success).toBe(true)
  })
})

describe("resetPasswordSchema", () => {
  it("8文字以上のパスワードは許可", () => {
    expect(resetPasswordSchema.safeParse({ studentId: "s", password: "12345678" }).success).toBe(true)
  })

  it("7文字以下のパスワードはエラー", () => {
    const result = resetPasswordSchema.safeParse({ studentId: "s", password: "1234567" })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("パスワードは8文字以上にしてください")
    }
  })
})

describe("testTypeSchema", () => {
  it("有効な TestType 値はパースを通過する", () => {
    for (const t of TEST_TYPES) {
      expect(testTypeSchema.safeParse(t).success).toBe(true)
    }
  })

  it("未定義の値はエラー", () => {
    expect(testTypeSchema.safeParse("midterm").success).toBe(false)
  })

  it("値が undefined のときは デフォルト 'other' になる", () => {
    const result = testTypeSchema.safeParse(undefined)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toBe("other")
  })
})

describe("GRADE_OPTIONS", () => {
  it("小学1年〜高校3年・浪人・その他 の14種類を含む", () => {
    expect(GRADE_OPTIONS).toHaveLength(14)
    expect(GRADE_OPTIONS).toContain("小学1年")
    expect(GRADE_OPTIONS).toContain("高校3年")
    expect(GRADE_OPTIONS).toContain("浪人")
    expect(GRADE_OPTIONS).toContain("その他")
  })
})
