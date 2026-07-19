import { spawnSync } from "node:child_process"

// Preview deployments may share neither the production database nor its migration
// lifecycle. Only the production Vercel build is allowed to mutate the production DB.
if (process.env.VERCEL_ENV !== "production") {
  console.log("[migrate] skipped (not a production Vercel build)")
  process.exit(0)
}

const configuredDirectUrl = process.env.DIRECT_URL
const migrationSourceUrl = configuredDirectUrl ?? process.env.DATABASE_URL
if (!migrationSourceUrl) {
  console.error("[migrate] DIRECT_URL or DATABASE_URL is required in production")
  process.exit(1)
}

let migrationUrl
try {
  migrationUrl = new URL(migrationSourceUrl)
} catch {
  console.error("[migrate] the migration database URL is not valid")
  process.exit(1)
}

if (migrationUrl.port === "6543") {
  if (configuredDirectUrl) {
    console.error("[migrate] DIRECT_URL must use a direct connection or the Supabase session pooler on port 5432, not port 6543")
    process.exit(1)
  }
  migrationUrl.port = "5432"
  migrationUrl.searchParams.delete("pgbouncer")
  migrationUrl.searchParams.delete("connection_limit")
  console.log("[migrate] using the Supabase session pooler derived from DATABASE_URL")
}

console.log("[migrate] applying production database migrations")
const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  env: { ...process.env, DIRECT_URL: migrationUrl.toString() },
  stdio: "inherit",
  timeout: 120_000,
})

if (result.error) {
  console.error("[migrate] failed to start Prisma:", result.error.message)
  process.exit(1)
}

process.exit(result.status ?? 1)
