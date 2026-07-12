/**
 * 科目IDの配列をタグ表示する共通コンポーネント。
 * map は queries.ts の buildSubjectMap で作った id→名前 の Map を渡す。
 */
export function SubjectTags({
  ids,
  map,
  className,
}: {
  ids: string[]
  map: Map<string, string>
  className?: string
}) {
  const names = ids.map((id) => map.get(id)).filter((n): n is string => !!n)
  if (names.length === 0) return null
  return (
    <div className={`flex flex-wrap gap-1 ${className ?? "mt-1"}`}>
      {names.map((name) => (
        <span key={name} className="text-xs bg-muted text-foreground rounded-full px-2 py-0.5">
          {name}
        </span>
      ))}
    </div>
  )
}
