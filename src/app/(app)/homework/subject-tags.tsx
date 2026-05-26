export function SubjectTagsList({ ids, map }: { ids: string[]; map: Map<string, string> }) {
  const names = ids.map((id) => map.get(id)).filter(Boolean) as string[]
  if (names.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {names.map((name) => (
        <span key={name} className="text-xs bg-gray-100 text-gray-700 rounded-full px-2 py-0.5">
          {name}
        </span>
      ))}
    </div>
  )
}
