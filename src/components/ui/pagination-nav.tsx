import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"

export function PaginationNav({
  pathname,
  page,
  total,
  pageSize,
  params = {},
}: {
  pathname: string
  page: number
  total: number
  pageSize: number
  params?: Record<string, string | undefined>
}) {
  const totalPages = Math.ceil(total / pageSize)
  if (totalPages <= 1) return null

  const hrefFor = (nextPage: number) => {
    const search = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (value) search.set(key, value)
    }
    if (nextPage > 1) search.set("page", String(nextPage))
    const query = search.toString()
    return query ? `${pathname}?${query}` : pathname
  }

  return (
    <nav aria-label="ページ送り" className="flex items-center justify-center gap-3 pt-2">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} prefetch={true} className={buttonVariants({ variant: "outline", size: "sm" })}>
          前へ
        </Link>
      ) : <span className="w-16" />}
      <span className="min-w-20 text-center text-xs text-muted-foreground">
        {page} / {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} prefetch={true} className={buttonVariants({ variant: "outline", size: "sm" })}>
          次へ
        </Link>
      ) : <span className="w-16" />}
    </nav>
  )
}
