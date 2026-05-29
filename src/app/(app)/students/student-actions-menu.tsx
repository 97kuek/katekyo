"use client"

import { useState } from "react"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { DeleteStudentButton } from "./delete-student-button"
import { ResetPasswordButton } from "./reset-password-button"

type GardenBadge = "full" | "withered" | "growing" | null

export function StudentActionsMenu({
  studentId,
  studentName,
  gardenBadge,
}: {
  studentId: string
  studentName: string
  gardenBadge: GardenBadge
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex items-center gap-1 flex-wrap">
      <button
        onClick={() => setOpen((v) => !v)}
        className={buttonVariants({ variant: "ghost", size: "xs" }) + " font-mono tracking-widest"}
        title="その他のアクション"
        aria-expanded={open}
      >
        {open ? "✕" : "…"}
      </button>

      {open && (
        <div className="flex items-center gap-2 flex-wrap border-l pl-2 ml-1">
          <Link href={`/students/${studentId}/parents`} className={buttonVariants({ variant: "ghost", size: "xs" })}>
            保護者管理
          </Link>
          <Link href={`/students/${studentId}/materials`} className={buttonVariants({ variant: "ghost", size: "xs" })}>
            教材
          </Link>
          <div className="flex items-center gap-1">
            <Link href={`/students/${studentId}/garden`} className={buttonVariants({ variant: "ghost", size: "xs" })}>
              森
            </Link>
            {gardenBadge === "full" ? (
              <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-1 rounded">満開</span>
            ) : gardenBadge === "withered" ? (
              <span className="inline-block h-2 w-2 rounded-full bg-amber-400 shrink-0" />
            ) : gardenBadge === "growing" ? (
              <span className="inline-block h-2 w-2 rounded-full bg-green-400 shrink-0" />
            ) : null}
          </div>
          <ResetPasswordButton studentId={studentId} />
          <DeleteStudentButton studentId={studentId} studentName={studentName} />
        </div>
      )}
    </div>
  )
}
