/*
  Warnings:

  - Made the column `email` on table `InviteToken` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "LessonType" AS ENUM ('online', 'offline');

-- AlterTable: fill NULL emails with placeholder before making required
UPDATE "InviteToken" SET "email" = 'unknown@placeholder.invalid' WHERE "email" IS NULL;
ALTER TABLE "InviteToken" ALTER COLUMN "email" SET NOT NULL;

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "durationMin" INTEGER,
    "type" "LessonType" NOT NULL DEFAULT 'online',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
