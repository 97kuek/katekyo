/** 未読を示す控えめなバッジ。StatusBadge と同じピル＋ドットの作法に合わせる。 */
export function UnreadBadge({ label = "未読" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
      {label}
    </span>
  )
}
