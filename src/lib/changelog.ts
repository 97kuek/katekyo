export type ChangelogEntry = {
  id: string
  date: string
  title: string
  items: string[]
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    id: "2026-06-06",
    date: "2026年6月6日",
    title: "見た目と使い勝手の改善",
    items: [
      "学習の森のイラストを立体的にし、陰影や奥行きを追加しました",
      "成績に「科目バランス」のレーダーチャートを追加しました（同じテスト名で科目ごとに記録すると表示されます）",
      "宿題・成績の一覧で、カードを左端までスワイプするとそのまま削除できるようになりました",
      "カレンダー・請求・成績の画面を整理し、余白やボタンを見やすくしました",
      "アプリ全体でボタンの見た目を統一し、ページ読み込み中の表示を追加しました",
    ],
  },
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
  | {
      role: "parent"
      homework: { id: string; title: string; studentName: string; isOverdue: boolean }[]
      lessons: { id: string; date: string; type: string; studentName: string }[]
    }
