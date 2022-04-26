-- AlterTable
ALTER TABLE "Round" ADD COLUMN "delete_warning" TEXT;

-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN "delete_warning" BOOLEAN;
