-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('PAN', 'GST', 'RC');

-- CreateTable
CREATE TABLE "OperatorDocument" (
    "id" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "busId" TEXT,
    "type" "DocumentType" NOT NULL,
    "publicId" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperatorDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OperatorDocument_operatorId_idx" ON "OperatorDocument"("operatorId");

-- CreateIndex
CREATE INDEX "OperatorDocument_busId_idx" ON "OperatorDocument"("busId");

-- AddForeignKey
ALTER TABLE "OperatorDocument" ADD CONSTRAINT "OperatorDocument_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Operator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperatorDocument" ADD CONSTRAINT "OperatorDocument_busId_fkey" FOREIGN KEY ("busId") REFERENCES "Bus"("id") ON DELETE CASCADE ON UPDATE CASCADE;
