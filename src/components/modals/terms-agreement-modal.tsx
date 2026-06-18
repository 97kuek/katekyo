"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { agreeToTerms } from "@/app/(app)/terms-actions"

export function TermsAgreementModal({ show }: { show: boolean }) {
  const [checked, setChecked] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  if (!show || agreed) return null

  function handleAgree() {
    startTransition(async () => {
      await agreeToTerms()
      setAgreed(true)
      router.refresh()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-[calc(env(safe-area-inset-top)+0.75rem)] sm:items-center sm:px-4 sm:py-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-agreement-title"
        className="flex max-h-full w-full max-w-md flex-col overflow-hidden rounded-lg border border-border bg-card shadow-xl"
      >
        <div className="shrink-0 px-5 pt-5 sm:px-6 sm:pt-6">
          <h2 id="terms-agreement-title" className="text-lg font-bold text-foreground">利用規約への同意</h2>
          <p className="text-sm text-muted-foreground mt-1">
            katekyoをご利用いただく前に、以下をご確認ください。
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
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
        </div>

        <div className="shrink-0 space-y-4 border-t bg-card px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
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
    </div>
  )
}
