/**
 * キャッシュタグの正本。IDは必ず認可後に渡す。
 * リソース単位と一覧単位を分け、Server Actionが必要な範囲だけ失効できるようにする。
 */
export const cacheTags = {
  user: (userId: string) => `user:${userId}`,
  student: (studentId: string) => `student:${studentId}`,
  teacherStudents: (teacherId: string) => `students:teacher:${teacherId}`,
  parentStudents: (parentId: string) => `students:parent:${parentId}`,
  subjects: (teacherId: string) => `subjects:teacher:${teacherId}`,
  materials: (studentId: string) => `materials:student:${studentId}`,
  homework: (homeworkId: string) => `homework:${homeworkId}`,
  teacherHomework: (teacherId: string) => `homework:teacher:${teacherId}`,
  studentHomework: (studentId: string) => `homework:student:${studentId}`,
  teacherGrades: (teacherId: string) => `grades:teacher:${teacherId}`,
  studentGrades: (studentId: string) => `grades:student:${studentId}`,
  teacherCalendar: (teacherId: string) => `calendar:teacher:${teacherId}`,
  studentCalendar: (studentId: string) => `calendar:student:${studentId}`,
  teacherBilling: (teacherId: string) => `billing:teacher:${teacherId}`,
  studentBilling: (studentId: string) => `billing:student:${studentId}`,
  garden: (studentId: string) => `garden:student:${studentId}`,
  notifications: (userId: string) => `notifications:user:${userId}`,
} as const
