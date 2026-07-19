import Link from "next/link"
import { ArrowLeft, CheckCircle2 } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { CopyButton } from "@/components/ui/copy-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function InviteLinkResult({
  url,
  message,
  nextHref,
  nextLabel,
}: {
  url: string
  message: string
  nextHref: string
  nextLabel: string
}) {
  return (
    <div className="min-w-0 max-w-full space-y-4">
      <p className="flex items-start gap-2 rounded-lg border border-primary/25 bg-primary/10 p-3 text-sm text-foreground">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <span>{message}</span>
      </p>
      <div className="min-w-0 max-w-full">
        <Label htmlFor="generated-invite-url">招待URL</Label>
        <div className="mt-1 grid min-w-0 max-w-full gap-2 sm:flex">
          <Input id="generated-invite-url" value={url} readOnly className="sm:text-xs" />
          <CopyButton value={url} />
        </div>
      </div>
      <Link href={nextHref} className={buttonVariants({ variant: "outline", className: "w-full justify-center" })}>
        <ArrowLeft aria-hidden />
        {nextLabel}
      </Link>
    </div>
  )
}
