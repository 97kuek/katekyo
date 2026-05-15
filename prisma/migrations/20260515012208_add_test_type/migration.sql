-- CreateEnum
CREATE TYPE "TestType" AS ENUM ('mock', 'exam', 'quiz', 'other');

-- AlterTable
ALTER TABLE "GradeRecord" ADD COLUMN     "testType" "TestType" NOT NULL DEFAULT 'other';
