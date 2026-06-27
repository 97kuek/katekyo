-- Lesson(studentId, date): 生徒カレンダー表示のクエリを高速化
CREATE INDEX "Lesson_studentId_date_idx" ON "Lesson"("studentId", "date");

-- ExamEvent(teacherId, date): カレンダーへのテスト予定表示を高速化
CREATE INDEX "ExamEvent_teacherId_date_idx" ON "ExamEvent"("teacherId", "date");
