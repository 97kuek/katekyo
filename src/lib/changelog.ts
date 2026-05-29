export type ChangelogEntry = {
  id: string
  date: string
  title: string
  items: string[]
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    id: "2026-05-29",
    date: "2026年5月29日",
    title: "保護者アカウントの実装・UIの改善",
    items: [
      "保護者用アカウントを実装しました。ダッシュボードの下部に保護者招待ボタンがあります。",
      "各種UIを改善しました。",
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
