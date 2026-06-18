import process from "node:process"
import { Pool } from "pg"
import dotenv from "dotenv"

const prefix = process.argv[2]

dotenv.config({ path: ".env.local", quiet: true })
dotenv.config({ path: ".env", quiet: true })

if (process.env.ALLOW_E2E_CLEANUP !== "1") {
  console.error("Refusing cleanup: set ALLOW_E2E_CLEANUP=1.")
  process.exit(1)
}

if (!prefix || prefix.length < 12 || !prefix.startsWith("codex-ui-flow-")) {
  console.error("Refusing cleanup: pass a codex-ui-flow-* email prefix.")
  process.exit(1)
}

if (!process.env.DATABASE_URL) {
  console.error("Refusing cleanup: DATABASE_URL is not set.")
  process.exit(1)
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const client = await pool.connect()

try {
  await client.query("begin")

  const usersResult = await client.query(
    'select id, role from "User" where email like $1',
    [`${prefix}%`],
  )
  const userIds = usersResult.rows.map((row) => row.id)
  const teacherIds = usersResult.rows.filter((row) => row.role === "teacher").map((row) => row.id)

  if (userIds.length === 0) {
    await client.query("commit")
    console.log(`No e2e users found for prefix ${prefix}.`)
    process.exit(0)
  }

  const studentsResult = await client.query(
    'select id from "Student" where "userId" = any($1::text[]) or "teacherId" = any($2::text[])',
    [userIds, teacherIds],
  )
  const studentIds = studentsResult.rows.map((row) => row.id)

  await client.query('delete from "HomeworkEvent" where "homeworkId" in (select id from "Homework" where "teacherId" = any($1::text[]) or "studentId" = any($2::text[]))', [teacherIds, studentIds])
  await client.query('delete from "Homework" where "teacherId" = any($1::text[]) or "studentId" = any($2::text[])', [teacherIds, studentIds])
  await client.query('delete from "GradeRecord" where "teacherId" = any($1::text[]) or "studentId" = any($2::text[])', [teacherIds, studentIds])
  await client.query('delete from "Lesson" where "teacherId" = any($1::text[]) or "studentId" = any($2::text[])', [teacherIds, studentIds])
  await client.query('delete from "ExamEvent" where "teacherId" = any($1::text[]) or "studentId" = any($2::text[])', [teacherIds, studentIds])
  await client.query('delete from "StudentMaterial" where "teacherId" = any($1::text[]) or "studentId" = any($2::text[])', [teacherIds, studentIds])
  await client.query('delete from "MonthlyPayment" where "teacherId" = any($1::text[]) or "studentId" = any($2::text[])', [teacherIds, studentIds])
  await client.query('delete from "GardenItem" where "studentId" = any($1::text[])', [studentIds])
  await client.query('delete from "ParentStudent" where "teacherId" = any($1::text[]) or "studentId" = any($2::text[]) or "parentId" = any($3::text[])', [teacherIds, studentIds, userIds])
  await client.query('delete from "ParentInviteToken" where "teacherId" = any($1::text[]) or "studentId" = any($2::text[])', [teacherIds, studentIds])
  await client.query('delete from "InviteToken" where "teacherId" = any($1::text[])', [teacherIds])
  await client.query('delete from "Subject" where "teacherId" = any($1::text[])', [teacherIds])
  await client.query('delete from "LineLinkToken" where "userId" = any($1::text[])', [userIds])
  await client.query('delete from "Student" where id = any($1::text[])', [studentIds])
  await client.query('delete from "User" where id = any($1::text[])', [userIds])

  await client.query("commit")
  console.log(`Deleted ${userIds.length} e2e users for prefix ${prefix}.`)
} catch (error) {
  await client.query("rollback")
  console.error(error)
  process.exitCode = 1
} finally {
  client.release()
  await pool.end()
}
