export type ChangelogEntry = {
  id: string
  date: string
  title: string
  items: string[]
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    id: "2026-06-05",
    date: "2026年6月5日",
    title: "モバイルデバイスでのUX改善",
    items: [
      "モバイルデバイスのUXを大幅に改善しました。特に、スワイプ操作のレスポンスと安定性が向上しています。",
      "テキストメッセージが改行されない問題を修正しました",
    ],
  },
]

export const LATEST_CHANGELOG_ID = CHANGELOG[0].id

export type NotificationData =
  | {
      role: "teacher"
      pendingHomework: { id: string; title: string; studentName: string }[]
      lessons: { id: string; date: string; type: string; studentName: string }[]
    }
  | {
      role: "student"
      homework: { id: string; title: string; dueDate: string; isOverdue: boolean }[]
      lessons: { id: string; date: string; type: string }[]
    }
