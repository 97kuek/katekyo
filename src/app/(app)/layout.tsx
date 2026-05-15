import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { Suspense } from "react"
import { Toaster } from "sonner"
import Sidebar from "@/components/layout/sidebar"
import Header from "@/components/layout/header"
import BottomNav from "@/components/layout/bottom-nav"
import { SearchParamsToast } from "@/components/success-toast"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <>
      <div className="flex h-screen bg-gray-50">
        <Sidebar role={session.user.role} />
        <div className="flex flex-col flex-1 min-w-0">
          <Header name={session.user.name ?? ""} />
          <main className="flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6">
            <div className="max-w-7xl mx-auto">
              <Suspense>
                <SearchParamsToast />
              </Suspense>
              {children}
            </div>
          </main>
        </div>
      </div>
      <BottomNav role={session.user.role} />
      <Toaster richColors position="top-center" />
    </>
  )
}
