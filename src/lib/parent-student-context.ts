import { cookies } from "next/headers"

export const PARENT_STUDENT_COOKIE = "katekyo_parent_student"

export async function resolveParentStudentId(allowedStudentIds: string[], requestedStudentId?: string) {
  if (requestedStudentId && allowedStudentIds.includes(requestedStudentId)) return requestedStudentId
  const cookieStore = await cookies()
  const remembered = cookieStore.get(PARENT_STUDENT_COOKIE)?.value
  if (remembered && allowedStudentIds.includes(remembered)) return remembered
  return allowedStudentIds[0]
}
