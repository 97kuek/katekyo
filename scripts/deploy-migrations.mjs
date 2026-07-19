import { spawnSync } from "node:child_process"

// Preview deployments may share neither the production database nor its migration
// lifecycle. Only the production Vercel build is allowed to mutate the production DB.
if (process.env.VERCEL_ENV !== "production") {
  console.log("[migrate] skipped (not a production Vercel build)")
  process.exit(0)
}

const directUrl = process.env.DIRECT_URL
if (!directUrl) {
  console.error("[migrate] DIRECT_URL is required in production; do not use the transaction pooler for migrations")
  process.exit(1)
}

let migrationUrl
try {
  migrationUrl = new URL(directUrl)
} catch {
  console.error("[migrate] DIRECT_URL is not a valid URL")
  process.exit(1)
}

if (migrationUrl.port === "6543") {
  console.error("[migrate] DIRECT_URL must use a direct connection or the Supabase session pooler on port 5432, not port 6543")
  process.exit(1)
}

console.log("[migrate] applying production database migrations")
const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  env: { ...process.env, DIRECT_URL: directUrl },
  stdio: "inherit",
  timeout: 120_000,
})

if (result.error) {
  console.error("[migrate] failed to start Prisma:", result.error.message)
  process.exit(1)
}

process.exit(result.status ?? 1)
