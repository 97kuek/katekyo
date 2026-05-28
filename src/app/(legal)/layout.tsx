import Link from "next/link"

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted">
      <header className="border-b border-border bg-background px-6 py-4">
        <Link href="/dashboard" className="text-sm font-semibold text-primary hover:text-primary/80">
          katekyo
        </Link>
      </header>
      <main className="max-w-2xl mx-auto px-6 py-10">
        {children}
      </main>
    </div>
  )
}
