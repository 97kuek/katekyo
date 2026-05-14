import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import Sidebar from "@/components/layout/sidebar"
import Header from "@/components/layout/header"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar role={session.user.role} />
      <div className="flex flex-col flex-1 min-w-0">
        <Header name={session.user.name ?? ""} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
