import { auth } from "./auth"
import { getStudentByUserId } from "./queries"

/**
 * Server Action の冒頭で使う認可ガード。
 * 規約（AGENTS.md）: セッション確認 → Zod → テナント絞り込み の「セッション確認」を共通化する。
 * 失敗時の応答（return { error } / redirect）は呼び出し側の責務のまま。
 */

/** teacher セッションを要求。満たさなければ null を返す */
export async function requireTeacher() {
  const session = await auth()
  if (!session || session.user.role !== "teacher") return null
  return { session, teacherId: session.user.id }
}

/** student セッションと生徒プロフィールを要求。満たさなければ null を返す */
export async function requireStudent() {
  const session = await auth()
  if (!session || session.user.role !== "student") return null
  const student = await getStudentByUserId(session.user.id)
  if (!student) return null
  return { session, student }
}
