import { spawnSync } from "node:child_process"
import { Pool } from "pg"

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

const migrationEnv = { ...process.env, DIRECT_URL: migrationUrl.toString() }
const pool = new Pool({
  connectionString: migrationUrl.toString(),
  connectionTimeoutMillis: 15_000,
  max: 1,
})

try {
  const [historyResult, schemaResult] = await Promise.all([
    pool.query(`
      SELECT "migration_name"
      FROM "_prisma_migrations"
      WHERE "finished_at" IS NOT NULL AND "rolled_back_at" IS NULL
    `),
    pool.query(`
      SELECT
        to_regclass('public."Lesson_studentId_date_idx"') IS NOT NULL AS lesson_student_date_index,
        to_regclass('public."ExamEvent_teacherId_date_idx"') IS NOT NULL AS exam_teacher_date_index,
        to_regclass('public."ParentInviteToken_expiresAt_idx"') IS NOT NULL AS parent_invite_expiry_index,
        to_regtype('public."IdentityProvider"') IS NOT NULL AS identity_provider_type,
        to_regtype('public."ProfileAccessKind"') IS NOT NULL AS profile_access_kind_type,
        to_regclass('public."AuthIdentity"') IS NOT NULL AS auth_identity_table,
        to_regclass('public."IdentityAccess"') IS NOT NULL AS identity_access_table,
        to_regclass('public."IdentityLinkIntent"') IS NOT NULL AS identity_link_intent_table,
        to_regclass('public."AuthAuditLog"') IS NOT NULL AS auth_audit_log_table,
        to_regclass('public."AuthIdentity_provider_providerSubject_key"') IS NOT NULL AS auth_identity_provider_key,
        to_regclass('public."IdentityAccess_identityId_userId_key"') IS NOT NULL AS identity_access_identity_user_key,
        to_regclass('public."IdentityAccess_userId_idx"') IS NOT NULL AS identity_access_user_index,
        to_regclass('public."IdentityLinkIntent_tokenHash_key"') IS NOT NULL AS identity_link_intent_token_key,
        to_regclass('public."IdentityLinkIntent_userId_idx"') IS NOT NULL AS identity_link_intent_user_index,
        to_regclass('public."IdentityLinkIntent_expiresAt_idx"') IS NOT NULL AS identity_link_intent_expiry_index,
        to_regclass('public."AuthAuditLog_userId_createdAt_idx"') IS NOT NULL AS auth_audit_log_user_index,
        to_regclass('public."AuthAuditLog_identityId_createdAt_idx"') IS NOT NULL AS auth_audit_log_identity_index,
        EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'IdentityAccess_identityId_fkey') AS identity_access_identity_fk,
        EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'IdentityAccess_userId_fkey') AS identity_access_user_fk,
        EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'IdentityLinkIntent_userId_fkey') AS identity_link_intent_user_fk
    `),
  ])

  const applied = new Set(historyResult.rows.map((row) => row.migration_name))
  const schema = schemaResult.rows[0]
  const legacyMigrations = [
    {
      name: "20260627000000_add_missing_indexes",
      present: schema.lesson_student_date_index && schema.exam_teacher_date_index,
    },
    {
      name: "20260715000000_add_parent_invite_expiry_index",
      present: schema.parent_invite_expiry_index,
    },
    {
      name: "20260715010000_add_external_identity_access",
      present: [
        schema.identity_provider_type,
        schema.profile_access_kind_type,
        schema.auth_identity_table,
        schema.identity_access_table,
        schema.identity_link_intent_table,
        schema.auth_audit_log_table,
        schema.auth_identity_provider_key,
        schema.identity_access_identity_user_key,
        schema.identity_access_user_index,
        schema.identity_link_intent_token_key,
        schema.identity_link_intent_user_index,
        schema.identity_link_intent_expiry_index,
        schema.auth_audit_log_user_index,
        schema.auth_audit_log_identity_index,
        schema.identity_access_identity_fk,
        schema.identity_access_user_fk,
        schema.identity_link_intent_user_fk,
      ].every(Boolean),
    },
  ]

  for (const migration of legacyMigrations) {
    if (applied.has(migration.name) || !migration.present) continue
    console.log(`[migrate] reconciling existing schema for ${migration.name}`)
    const resolveResult = spawnSync(
      "npx",
      ["prisma", "migrate", "resolve", "--applied", migration.name],
      { env: migrationEnv, stdio: "inherit", timeout: 30_000 }
    )
    if (resolveResult.error || resolveResult.status !== 0) {
      console.error(`[migrate] failed to reconcile ${migration.name}`)
      process.exit(1)
    }
  }
} catch (error) {
  console.error("[migrate] failed to inspect the production schema:", error instanceof Error ? error.message : error)
  process.exit(1)
} finally {
  await pool.end()
}

console.log("[migrate] applying production database migrations")
const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  env: migrationEnv,
  stdio: "inherit",
  timeout: 120_000,
})

if (result.error) {
  console.error("[migrate] failed to start Prisma:", result.error.message)
  process.exit(1)
}

process.exit(result.status ?? 1)
