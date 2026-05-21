export type ChangelogEntry = {
  id: string
  date: string
  title: string
  items: string[]
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    id: "2026-05-22",
    date: "2026年5月22日",
    title: "一部不具合の修正と機能改善",
    items: [
      "宿題提出時に写真が送信できなくなるバグを修正しました",
      "繰り返し授業登録時にエラーページへ飛んでしまうバグを修正しました",
      "学習の森の季節演出を追加しました",
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
