-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "hourlyRate" INTEGER,
ADD COLUMN     "lessonLog" TEXT,
ADD COLUMN     "travelExpense" INTEGER;

-- CreateTable
CREATE TABLE "HomeworkTemplate" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HomeworkTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HomeworkTemplate_teacherId_idx" ON "HomeworkTemplate"("teacherId");

-- AddForeignKey
ALTER TABLE "HomeworkTemplate" ADD CONSTRAINT "HomeworkTemplate_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
