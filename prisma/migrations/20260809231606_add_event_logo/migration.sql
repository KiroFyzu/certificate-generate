-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "logo_path" TEXT,
ADD COLUMN     "logo_position" TEXT NOT NULL DEFAULT 'top-center';
