import Link from "next/link"
import { BookOpen, BarChart2, TreePine, MessageSquare } from "lucide-react"

const FEATURES = [
  { Icon: BookOpen,     text: "宿題の提出・承認・差し戻しをシンプルに管理" },
  { Icon: BarChart2,    text: "テスト成績を記録してグラフで推移を可視化" },
  { Icon: TreePine,     text: "頑張りが森に育つ「学習の森」でモチベーション維持" },
  { Icon: MessageSquare, text: "承認・差し戻し・授業リマインダーを LINE で自動通知" },
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* ブランドパネル */}
      <div className="bg-[#2e743a] text-white flex flex-col justify-center px-8 py-8 md:w-1/2 md:min-h-screen">
        <div className="max-w-sm mx-auto w-full space-y-4 md:space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2e743a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 0 3-3h7z" />
              </svg>
            </div>
            <span className="text-2xl font-bold tracking-tight">katekyo</span>
          </div>
          <p className="text-base md:text-lg font-medium leading-snug">
            家庭教師と生徒を<br />つなぐ学習管理アプリ
          </p>
          {/* 機能リスト — モバイルでは非表示 */}
          <ul className="hidden md:block space-y-3">
            {FEATURES.map(({ Icon, text }) => (
              <li key={text} className="flex items-start gap-2.5 text-sm text-white/90">
                <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* フォームパネル */}
      <div className="flex flex-col items-center justify-center px-4 py-8 bg-gray-50 md:w-1/2 md:min-h-screen">
        <div className="w-full max-w-md space-y-6">
          {children}
          <footer className="flex justify-center gap-4 text-xs text-gray-400">
            <Link href="/terms" className="hover:text-gray-600">利用規約</Link>
            <Link href="/privacy" className="hover:text-gray-600">プライバシーポリシー</Link>
          </footer>
        </div>
      </div>
    </div>
  )
}
