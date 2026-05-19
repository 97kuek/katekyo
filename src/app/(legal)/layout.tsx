import Link from "next/link"

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-6 py-4">
        <Link href="/dashboard" className="text-sm font-semibold text-green-700 hover:text-green-900">
          katekyo
        </Link>
      </header>
      <main className="max-w-2xl mx-auto px-6 py-10">
        {children}
      </main>
    </div>
  )
}
