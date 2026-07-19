import Link from "next/link"
import { redirect } from "next/navigation"
import { BarChart2, BookOpen, ChevronRight, CircleHelp, Receipt, Settings, TreePine, UserRound } from "lucide-react"
import { getViewingContext } from "@/lib/view-as"
import { PageHeader } from "@/components/ui/page-header"

const commonItems = [
  { href: "/profile", label: "プロフィール", description: "名前やパスワード", icon: UserRound },
  { href: "/settings", label: "設定", description: "通知や連携サービス", icon: Settings },
  { href: "/help", label: "使い方ガイド", description: "操作方法を確認", icon: CircleHelp },
]

export default async function MorePage() {
  const ctx = await getViewingContext()
  if (!ctx) redirect("/login")

  const roleItems = ctx.effectiveRole === "teacher"
    ? [
        { href: "/grades", label: "成績", description: "記録と推移", icon: BarChart2 },
        { href: "/billing", label: "請求", description: "請求額と入金状況", icon: Receipt },
      ]
    : ctx.effectiveRole === "parent"
      ? [
          { href: "/homework", label: "宿題", description: "提出状況を確認", icon: BookOpen },
          { href: "/garden", label: "学習の森", description: "学習の積み重ね", icon: TreePine },
        ]
      : [
          { href: "/garden", label: "学習の森", description: "学習の積み重ね", icon: TreePine },
          { href: "/materials", label: "教材", description: "登録されている教材", icon: BookOpen },
        ]

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader title="その他" description="学習記録やアカウントに関するメニューです。" />
      <div className="overflow-hidden rounded-lg border bg-card">
        {[...roleItems, ...commonItems].map(({ href, label, description, icon: Icon }, index) => (
          <Link
            key={href}
            href={href}
            className={`flex min-h-16 items-center gap-3 px-4 py-3 transition-colors hover:bg-muted ${index > 0 ? "border-t" : ""}`}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{label}</span>
              <span className="block text-xs text-muted-foreground">{description}</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          </Link>
        ))}
      </div>
    </div>
  )
}
