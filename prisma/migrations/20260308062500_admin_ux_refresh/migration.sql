-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MemberStatus" ADD VALUE 'PAUSED';
ALTER TYPE "MemberStatus" ADD VALUE 'WITHDRAWN';

-- AlterTable
ALTER TABLE "Banner" ADD COLUMN     "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "thumbnailUrl" TEXT;

-- AlterTable
ALTER TABLE "ReservableOffering" ADD COLUMN     "thumbnailUrl" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "creditGrantDay" INTEGER;

