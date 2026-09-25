-- Every page now belongs to a project; workspace-level pages are removed.
DELETE FROM "Favorite"
WHERE "entityType" = 'PAGE'
  AND "entityId" IN (SELECT "id" FROM "Page" WHERE "projectId" IS NULL);

DELETE FROM "Page" WHERE "projectId" IS NULL;

-- DropForeignKey
ALTER TABLE "Page" DROP CONSTRAINT "Page_projectId_fkey";

-- AlterTable
ALTER TABLE "Page" ALTER COLUMN "projectId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
