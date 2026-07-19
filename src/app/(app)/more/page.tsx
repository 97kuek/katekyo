import Link from "next/link"
import { redirect } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { getViewingContext } from "@/lib/view-as"
import { PageHeader } from "@/components/ui/page-header"
import { getMoreNavigation, normalizeRole } from "@/components/layout/navigation-config"

export default async function MorePage() {
  const ctx = await getViewingContext()
  if (!ctx) redirect("/login")

  const groups = getMoreNavigation(normalizeRole(ctx.effectiveRole))

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader title="その他" description="目的に合わせてメニューを選んでください。" />
      {groups.map((group) => (
        <section key={group.label} aria-labelledby={`more-${group.label}`} className="space-y-2">
          <h2 id={`more-${group.label}`} className="px-1 text-xs font-semibold text-muted-foreground">{group.label}</h2>
          <div className="overflow-hidden rounded-lg border bg-card">
            {group.items.map(({ href, label, description, icon: Icon }, index) => (
              <Link
                key={href}
                href={href}
                prefetch={true}
                className={`flex min-h-16 items-center gap-3 px-4 py-3 transition-colors hover:bg-muted ${index > 0 ? "border-t" : ""}`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{label}</span>
                  <span className="block text-xs text-muted-foreground">{description}</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
