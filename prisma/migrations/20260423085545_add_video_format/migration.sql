-- CreateEnum
CREATE TYPE "VideoFormat" AS ENUM ('A', 'C');

-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "format" "VideoFormat";
