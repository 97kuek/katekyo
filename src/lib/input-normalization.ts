export function normalizeEmailInput(value: unknown): unknown {
  return typeof value === "string" ? value.trim().normalize("NFKC").toLowerCase() : value
}
