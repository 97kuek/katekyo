-- CreateEnum
CREATE TYPE "GardenItemType" AS ENUM ('tree', 'bush', 'flower');

-- CreateTable
CREATE TABLE "GardenItem" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    "itemType" "GardenItemType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GardenItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GardenItem_studentId_idx" ON "GardenItem"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "GardenItem_studentId_x_y_key" ON "GardenItem"("studentId", "x", "y");

-- AddForeignKey
ALTER TABLE "GardenItem" ADD CONSTRAINT "GardenItem_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
