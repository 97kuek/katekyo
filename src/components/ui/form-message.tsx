import { AlertCircle, CheckCircle2 } from "lucide-react"

export function FormMessage({ type, children }: { type: "error" | "success"; children: React.ReactNode }) {
  const Icon = type === "error" ? AlertCircle : CheckCircle2
  const styles = type === "error"
    ? "border-destructive/30 bg-destructive/10"
    : "border-primary/25 bg-primary/10"
  return (
    <p role={type === "error" ? "alert" : "status"} className={`flex items-start gap-2 rounded-lg border p-3 text-sm text-foreground ${styles}`}>
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${type === "error" ? "text-destructive" : "text-primary"}`} aria-hidden />
      {children}
    </p>
  )
}
