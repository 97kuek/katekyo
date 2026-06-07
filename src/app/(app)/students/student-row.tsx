"use client"

import { useRouter } from "next/navigation"

export function StudentRow({ href, children }: { href: string; children: React.ReactNode }) {
  const router = useRouter()
  return (
    <tr onClick={() => router.push(href)} className="hover:bg-muted cursor-pointer">
      {children}
    </tr>
  )
}
