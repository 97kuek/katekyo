-- Compound indexes for the status/date filters used by paginated app views.
CREATE INDEX "Homework_studentId_status_dueDate_idx" ON "Homework"("studentId", "status", "dueDate");
CREATE INDEX "Homework_studentId_status_reviewedAt_idx" ON "Homework"("studentId", "status", "reviewedAt");
CREATE INDEX "Homework_teacherId_status_dueDate_idx" ON "Homework"("teacherId", "status", "dueDate");
CREATE INDEX "Homework_teacherId_status_createdAt_idx" ON "Homework"("teacherId", "status", "createdAt");
CREATE INDEX "GradeRecord_studentId_date_idx" ON "GradeRecord"("studentId", "date");
CREATE INDEX "GradeRecord_studentId_testType_date_idx" ON "GradeRecord"("studentId", "testType", "date");
CREATE INDEX "GradeRecord_teacherId_date_idx" ON "GradeRecord"("teacherId", "date");
CREATE INDEX "GradeRecord_teacherId_testType_date_idx" ON "GradeRecord"("teacherId", "testType", "date");
CREATE INDEX "MonthlyPayment_studentId_year_month_idx" ON "MonthlyPayment"("studentId", "year", "month");
CREATE INDEX "MonthlyPayment_teacherId_year_month_idx" ON "MonthlyPayment"("teacherId", "year", "month");

-- GIN indexes support subject-array filters without scanning every row.
CREATE INDEX "Homework_subjectIds_idx" ON "Homework" USING GIN ("subjectIds");
CREATE INDEX "GradeRecord_subjectIds_idx" ON "GradeRecord" USING GIN ("subjectIds");
CREATE INDEX "StudentMaterial_subjectIds_idx" ON "StudentMaterial" USING GIN ("subjectIds");
