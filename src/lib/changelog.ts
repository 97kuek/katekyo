export type ChangelogEntry = {
  id: string
  date: string
  title: string
  items: string[]
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    id: "2025-05-21",
    date: "2025年5月21日",
    title: "Google Meet リンク・授業リマインダー",
    items: [
      "授業ページに Google Meet リンクを保存できるようになりました",
      "授業開始30分前に LINE でリマインダーが届くようになりました",
      "生徒が LINE 連携を完了したとき先生に通知が届くようになりました",
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
