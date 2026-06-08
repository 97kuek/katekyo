// 宿題の難易度を昇順のバーで表現（絵文字を使わずブランドに馴染むミニマルな表現）。
// 色は currentColor を継承するので、親の text-* で着色できる。
export function DifficultyBars({ level, className = "w-[18px] h-3" }: { level: number; className?: string }) {
  return (
    <svg viewBox="0 0 22 14" className={className} fill="none" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <rect key={i} x={i * 8} y={10 - i * 4} width={5} height={4 + i * 4} rx={1}
          fill="currentColor" opacity={i < level ? 1 : 0.25} />
      ))}
    </svg>
  )
}
