-- CreateTable
CREATE TABLE "ExamEvent" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "testType" "TestType" NOT NULL DEFAULT 'exam',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExamEvent_teacherId_idx" ON "ExamEvent"("teacherId");

-- CreateIndex
CREATE INDEX "ExamEvent_studentId_idx" ON "ExamEvent"("studentId");

-- CreateIndex
CREATE INDEX "ExamEvent_date_idx" ON "ExamEvent"("date");

-- AddForeignKey
ALTER TABLE "ExamEvent" ADD CONSTRAINT "ExamEvent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamEvent" ADD CONSTRAINT "ExamEvent_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
