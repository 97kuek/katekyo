import Link from "next/link"

export function HomeworkViewTabs({
  current,
  items,
  params,
}: {
  current: string
  items: Array<{ value: string; label: string; count: number }>
  params?: Record<string, string | undefined>
}) {
  return (
    <nav aria-label="宿題の表示" className="flex gap-1 overflow-x-auto rounded-lg border bg-card p-1">
      {items.map((item) => {
        const search = new URLSearchParams()
        Object.entries(params ?? {}).forEach(([key, value]) => {
          if (value) search.set(key, value)
        })
        search.set("view", item.value)
        const active = current === item.value
        return (
          <Link
            key={item.value}
            href={`/homework?${search.toString()}`}
            prefetch={true}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-11 flex-1 items-center justify-center whitespace-nowrap rounded-md px-3 text-sm font-medium transition-[background-color,opacity] active:opacity-75 motion-reduce:transition-none ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
          >
            {item.label}<span className="ml-1 tabular-nums">{item.count}</span>
          </Link>
        )
      })}
    </nav>
  )
}
