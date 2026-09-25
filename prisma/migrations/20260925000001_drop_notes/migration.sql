-- Notes were replaced by Pages; nothing in the app reads or writes them anymore.

-- Rows that point at notes or at the enum values removed below. Left in place
-- they would dangle, or make the enum casts fail.
DELETE FROM "Favorite" WHERE "entityType" = 'NOTE';
DELETE FROM "KnowledgeChunk" WHERE "sourceType" = 'NOTE';
DELETE FROM "Activity" WHERE "type" IN ('NOTE_CREATED', 'NOTE_DELETED');

-- AlterEnum
BEGIN;
CREATE TYPE "KnowledgeSource_new" AS ENUM ('DOCUMENT', 'MEETING', 'MEMORY', 'WHITEBOARD');
ALTER TABLE "KnowledgeChunk" ALTER COLUMN "sourceType" TYPE "KnowledgeSource_new" USING ("sourceType"::text::"KnowledgeSource_new");
ALTER TYPE "KnowledgeSource" RENAME TO "KnowledgeSource_old";
ALTER TYPE "KnowledgeSource_new" RENAME TO "KnowledgeSource";
DROP TYPE "KnowledgeSource_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ContentType_new" AS ENUM ('DOC', 'ISSUE', 'PR', 'CODE', 'CHAT');
ALTER TABLE "Document" ALTER COLUMN "contentType" TYPE "ContentType_new" USING ("contentType"::text::"ContentType_new");
ALTER TYPE "ContentType" RENAME TO "ContentType_old";
ALTER TYPE "ContentType_new" RENAME TO "ContentType";
DROP TYPE "ContentType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "FavoriteEntityType_new" AS ENUM ('PROJECT', 'TASK', 'WHITEBOARD', 'PAGE');
ALTER TABLE "Favorite" ALTER COLUMN "entityType" TYPE "FavoriteEntityType_new" USING ("entityType"::text::"FavoriteEntityType_new");
ALTER TYPE "FavoriteEntityType" RENAME TO "FavoriteEntityType_old";
ALTER TYPE "FavoriteEntityType_new" RENAME TO "FavoriteEntityType";
DROP TYPE "FavoriteEntityType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Note" DROP CONSTRAINT "Note_workspaceId_fkey";

-- DropForeignKey
ALTER TABLE "Note" DROP CONSTRAINT "Note_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Note" DROP CONSTRAINT "Note_authorId_fkey";

-- DropTable
DROP TABLE "Note";
