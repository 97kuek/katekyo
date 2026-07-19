import { spawnSync } from "node:child_process"

// Preview deployments may share neither the production database nor its migration
// lifecycle. Only the production Vercel build is allowed to mutate the production DB.
if (process.env.VERCEL_ENV !== "production") {
  console.log("[migrate] skipped (not a production Vercel build)")
  process.exit(0)
}

if (!process.env.DIRECT_URL && !process.env.DATABASE_URL) {
  console.error("[migrate] DIRECT_URL or DATABASE_URL is required in production")
  process.exit(1)
}

console.log("[migrate] applying production database migrations")
const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  env: process.env,
  stdio: "inherit",
})

if (result.error) {
  console.error("[migrate] failed to start Prisma:", result.error.message)
  process.exit(1)
}

process.exit(result.status ?? 1)
