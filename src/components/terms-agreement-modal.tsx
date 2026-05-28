"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { agreeToTerms } from "@/app/(app)/terms-actions"

export function TermsAgreementModal({ show }: { show: boolean }) {
  const [checked, setChecked] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  if (!show) return null

  function handleAgree() {
    startTransition(async () => {
      await agreeToTerms()
      router.refresh()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4 pb-4 sm:pb-0">
      <div className="bg-card rounded-2xl w-full max-w-md p-6 space-y-5 shadow-xl border border-border">
        <div>
          <h2 className="text-lg font-bold text-foreground">利用規約への同意</h2>
          <p className="text-sm text-muted-foreground mt-1">
            katekyoをご利用いただく前に、以下をご確認ください。
          </p>
        </div>

        <div className="rounded-lg border bg-muted p-4 text-sm text-foreground space-y-2">
          <p>・本サービスは招待を受けた家庭教師・生徒のみご利用いただけます。</p>
          <p>・氏名・成績・授業記録などの個人情報を取り扱います。</p>
          <p>・データは1学年分保持後、毎年4月に自動削除されます。</p>
          <p>
            詳細は{" "}
            <Link href="/terms" target="_blank" className="text-primary underline">利用規約</Link>
            {" "}および{" "}
            <Link href="/privacy" target="_blank" className="text-primary underline">プライバシーポリシー</Link>
            {" "}をご覧ください。
          </p>
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-input accent-primary"
          />
          <span className="text-sm text-foreground">
            利用規約およびプライバシーポリシーに同意します
          </span>
        </label>

        <button
          onClick={handleAgree}
          disabled={!checked || isPending}
          className="w-full py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isPending ? "処理中..." : "同意してはじめる"}
        </button>
      </div>
    </div>
  )
}
