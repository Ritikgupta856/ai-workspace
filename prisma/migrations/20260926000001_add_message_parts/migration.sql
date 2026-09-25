-- AlterTable
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "parts" JSONB;
