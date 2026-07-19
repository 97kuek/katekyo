"use client"

import { useEffect } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { toast } from "sonner"

const MESSAGES: Record<string, string> = {
  submitted: "宿題を提出しました",
  reviewed: "確認しました",
  created: "成績を記録しました。次は推移グラフで変化を確認できます",
  "homework-created": "宿題を作成しました。次は一覧から内容を確認できます",
  saved: "変更を保存しました。一覧へ反映されています",
  deleted: "削除しました",
}

export function SearchParamsToast() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const key = searchParams.get("toast")
    if (!key) return
    const msg = MESSAGES[key]
    if (msg) toast.success(msg)
    const params = new URLSearchParams(searchParams.toString())
    params.delete("toast")
    const next = params.size > 0 ? `${pathname}?${params}` : pathname
    router.replace(next)
  }, [searchParams, router, pathname])

  return null
}
