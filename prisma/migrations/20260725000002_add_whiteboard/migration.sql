CREATE TABLE IF NOT EXISTS "Whiteboard" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "projectId" TEXT,
    "title" TEXT NOT NULL DEFAULT 'Untitled board',
    "scene" JSONB,
    "files" JSONB,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Whiteboard_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Whiteboard_workspaceId_idx" ON "Whiteboard"("workspaceId");
CREATE INDEX IF NOT EXISTS "Whiteboard_projectId_idx" ON "Whiteboard"("projectId");

ALTER TABLE "Whiteboard" ADD CONSTRAINT "Whiteboard_workspaceId_fkey"
    FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Whiteboard" ADD CONSTRAINT "Whiteboard_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Whiteboard" ADD CONSTRAINT "Whiteboard_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
