/*
  Warnings:

  - You are about to drop the column `destination` on the `Route` table. All the data in the column will be lost.
  - You are about to drop the column `source` on the `Route` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[operatorId,sourceCityId,destinationCityId]` on the table `Route` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `destinationCityId` to the `Route` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sourceCityId` to the `Route` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Route_operatorId_source_destination_key";

-- DropIndex
DROP INDEX "Route_source_destination_key";

-- AlterTable
ALTER TABLE "Route" DROP COLUMN "destination",
DROP COLUMN "source",
ADD COLUMN     "destinationCityId" TEXT NOT NULL,
ADD COLUMN     "sourceCityId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "City" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "state" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "City_slug_key" ON "City"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Route_operatorId_sourceCityId_destinationCityId_key" ON "Route"("operatorId", "sourceCityId", "destinationCityId");

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_sourceCityId_fkey" FOREIGN KEY ("sourceCityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_destinationCityId_fkey" FOREIGN KEY ("destinationCityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
