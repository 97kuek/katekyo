import {
  BarChart2,
  BookOpen,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  Grid2X2,
  LayoutDashboard,
  Receipt,
  TreePine,
  CircleHelp,
  Settings,
  UserRound,
} from "lucide-react"

export type AppRole = "teacher" | "student" | "parent"

export type MoreNavigationGroup = {
  label: string
  items: Array<{
    href: string
    label: string
    description: string
    icon: typeof UserRound
  }>
}

const accountMoreGroup: MoreNavigationGroup = {
  label: "アカウント",
  items: [
    { href: "/profile", label: "プロフィール", description: "名前とパスワード", icon: UserRound },
    { href: "/settings", label: "設定", description: "通知・連携・科目タグ", icon: Settings },
  ],
}

const supportMoreGroup: MoreNavigationGroup = {
  label: "サポート",
  items: [
    { href: "/help", label: "使い方ガイド", description: "機能と操作方法を確認", icon: CircleHelp },
  ],
}

export function getMoreNavigation(role: AppRole): MoreNavigationGroup[] {
  const roleGroup: MoreNavigationGroup = role === "teacher"
    ? {
        label: "学習管理",
        items: [
          { href: "/grades", label: "成績", description: "記録と推移", icon: BarChart2 },
          { href: "/billing", label: "請求", description: "請求額と入金状況", icon: Receipt },
        ],
      }
    : role === "parent"
      ? {
          label: "学習",
          items: [
            { href: "/homework", label: "宿題", description: "提出状況を確認", icon: BookOpen },
            { href: "/garden", label: "学習の森", description: "学習の積み重ね", icon: TreePine },
          ],
        }
      : {
          label: "学習",
          items: [
            { href: "/garden", label: "学習の森", description: "学習の積み重ね", icon: TreePine },
            { href: "/materials", label: "教材", description: "登録されている教材", icon: BookOpen },
          ],
        }

  return [roleGroup, accountMoreGroup, supportMoreGroup]
}

export const desktopNavigation = {
  teacher: [
    { href: "/dashboard", label: "ホーム", icon: LayoutDashboard },
    { href: "/students", label: "生徒", icon: GraduationCap },
    { href: "/homework", label: "宿題", icon: ClipboardList },
    { href: "/calendar", label: "予定", icon: CalendarDays },
    { href: "/grades", label: "成績", icon: BarChart2 },
    { href: "/billing", label: "請求", icon: Receipt },
  ],
  student: [
    { href: "/dashboard", label: "ホーム", icon: LayoutDashboard },
    { href: "/homework", label: "宿題", icon: ClipboardList },
    { href: "/calendar", label: "予定", icon: CalendarDays },
    { href: "/grades", label: "成績", icon: BarChart2 },
    { href: "/garden", label: "学習の森", icon: TreePine },
    { href: "/materials", label: "教材", icon: BookOpen },
  ],
  parent: [
    { href: "/dashboard", label: "ホーム", icon: LayoutDashboard },
    { href: "/calendar", label: "予定", icon: CalendarDays },
    { href: "/grades", label: "成績", icon: BarChart2 },
    { href: "/homework", label: "宿題", icon: ClipboardList },
    { href: "/billing", label: "請求", icon: Receipt },
  ],
} as const

export const mobileNavigation = {
  teacher: [
    { href: "/dashboard", label: "ホーム", icon: LayoutDashboard },
    { href: "/students", label: "生徒", icon: GraduationCap },
    { href: "/homework", label: "宿題", icon: ClipboardList },
    { href: "/calendar", label: "予定", icon: CalendarDays },
    { href: "/more", label: "その他", icon: Grid2X2 },
  ],
  student: [
    { href: "/dashboard", label: "ホーム", icon: LayoutDashboard },
    { href: "/homework", label: "宿題", icon: ClipboardList },
    { href: "/calendar", label: "予定", icon: CalendarDays },
    { href: "/grades", label: "学習", icon: BarChart2 },
    { href: "/more", label: "その他", icon: Grid2X2 },
  ],
  parent: [
    { href: "/dashboard", label: "ホーム", icon: LayoutDashboard },
    { href: "/calendar", label: "予定", icon: CalendarDays },
    { href: "/grades", label: "学習", icon: BarChart2 },
    { href: "/billing", label: "請求", icon: Receipt },
    { href: "/more", label: "その他", icon: Grid2X2 },
  ],
} as const

export function normalizeRole(role: string): AppRole {
  return role === "teacher" || role === "parent" ? role : "student"
}

const pageTitles: Array<{ matches: (pathname: string) => boolean; title: string }> = [
  { matches: (p) => p === "/dashboard", title: "ホーム" },
  { matches: (p) => p === "/students/invite", title: "生徒を招待" },
  { matches: (p) => p === "/students/invites", title: "招待管理" },
  { matches: (p) => p.includes("/invite-parent"), title: "保護者を招待" },
  { matches: (p) => p.endsWith("/parents"), title: "保護者管理" },
  { matches: (p) => p.endsWith("/materials"), title: "教材" },
  { matches: (p) => p.endsWith("/garden"), title: "学習の森" },
  { matches: (p) => p.startsWith("/students/") && p.endsWith("/grades"), title: "生徒の成績" },
  { matches: (p) => p.startsWith("/students/"), title: "生徒詳細" },
  { matches: (p) => p === "/students", title: "生徒" },
  { matches: (p) => p === "/homework/new", title: "宿題を作成" },
  { matches: (p) => p.endsWith("/review"), title: "宿題を確認" },
  { matches: (p) => p.endsWith("/submit"), title: "宿題を提出" },
  { matches: (p) => p.startsWith("/homework/") && p.endsWith("/edit"), title: "宿題を編集" },
  { matches: (p) => p.startsWith("/homework/"), title: "宿題詳細" },
  { matches: (p) => p === "/homework", title: "宿題" },
  { matches: (p) => p === "/grades/new", title: "成績を記録" },
  { matches: (p) => p.startsWith("/grades/") && p.endsWith("/edit"), title: "成績を編集" },
  { matches: (p) => p === "/grades", title: "成績" },
  { matches: (p) => p === "/calendar", title: "予定" },
  { matches: (p) => p === "/billing", title: "請求" },
  { matches: (p) => p === "/materials", title: "教材" },
  { matches: (p) => p === "/garden", title: "学習の森" },
  { matches: (p) => p === "/more", title: "その他" },
  { matches: (p) => p === "/profile", title: "プロフィール" },
  { matches: (p) => p === "/help", title: "使い方ガイド" },
  { matches: (p) => p === "/settings", title: "設定" },
]

export function getPageTitle(pathname: string): string {
  return pageTitles.find(({ matches }) => matches(pathname))?.title ?? "katekyo"
}
