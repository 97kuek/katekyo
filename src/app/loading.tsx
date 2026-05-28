export default function Loading() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-5 bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 0 3-3h7z" />
          </svg>
        </div>
        <span className="text-lg font-bold text-foreground">katekyo</span>
      </div>
      <div className="w-8 h-8 border-[3px] border-muted border-t-primary rounded-full animate-spin" />
    </div>
  )
}
