import { db } from "./db"

/** 指定された科目IDがすべて同じ先生のテナントに属する場合だけ、重複除去して返す。 */
export async function validateTeacherSubjectIds(
  teacherId: string,
  values: readonly string[],
): Promise<string[] | null> {
  const subjectIds = [...new Set(values)]
  if (subjectIds.some((id) => !id)) return null
  if (subjectIds.length === 0) return []

  const count = await db.subject.count({ where: { teacherId, id: { in: subjectIds } } })
  return count === subjectIds.length ? subjectIds : null
}
