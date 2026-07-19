ALTER TABLE "GardenItem" ADD COLUMN "sourceGradeId" TEXT;
ALTER TABLE "GradeRecord" ADD COLUMN "gardenEvaluationVersion" INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX "GardenItem_sourceGradeId_key" ON "GardenItem"("sourceGradeId");

ALTER TABLE "GardenItem"
ADD CONSTRAINT "GardenItem_sourceGradeId_fkey"
FOREIGN KEY ("sourceGradeId") REFERENCES "GradeRecord"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
