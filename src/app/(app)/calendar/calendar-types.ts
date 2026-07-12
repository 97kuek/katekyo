// calendar 配下で共有する型と純粋関数

export type Subject = { id: string; name: string }

export type Lesson = {
  id: string
  date: Date
  type: "online" | "offline"
  durationMin: number | null
  notes: string | null
  lessonLog: string | null
  lessonLogPublic: boolean
  subjectIds: string[]
  hourlyRate: number | null
  travelExpense: number | null
  completedAt: Date | null
  meetLink: string | null
  student: { user: { name: string } }
}

export type HomeworkDeadline = {
  id: string
  title: string
  dueDate: Date
  studentName: string
}

export type ExamEvent = {
  id: string
  date: Date
  endDate?: Date | null
  name: string
  testType: string
  studentName?: string
}

export type Student = { id: string; grade: string; user: { name: string }; defaultHourlyRate?: number | null; defaultTravelExpense?: number | null; defaultDurationMin?: number | null; defaultSubjectIds?: string[] | null }

export function pad(n: number) { return String(n).padStart(2, "0") }

export function toDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export const DOW_LABELS = ["日", "月", "火", "水", "木", "金", "土"]
