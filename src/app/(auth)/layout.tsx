import Link from "next/link"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">{children}</div>
      <footer className="mt-8 flex gap-4 text-xs text-gray-400">
        <Link href="/terms" className="hover:text-gray-600">利用規約</Link>
        <Link href="/privacy" className="hover:text-gray-600">プライバシーポリシー</Link>
      </footer>
    </div>
  )
}
