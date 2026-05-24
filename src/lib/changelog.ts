export type ChangelogEntry = {
  id: string
  date: string
  title: string
  items: string[]
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    id: "2026-05-24",
    date: "2026年5月24日",
    title: "UIの改善",
    items: [
      "ボトムナビゲーションの広さを調整しました",
      "ログイン画面にアプリの説明を追加しました",
      "各種フォームの入力項目を整理しました",
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
