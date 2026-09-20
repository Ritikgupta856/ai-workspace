-- Data-only migration: project access has always been workspace-wide in
-- practice (no code ever wrote to ProjectMember), so backfill every existing
-- project with its workspace's current roster before the app starts treating
-- ProjectMember as the real source of truth. Nobody loses access they
-- already effectively had; only *new* projects start with just their creator.
INSERT INTO "ProjectMember" ("id", "projectId", "userId", "role", "createdAt")
SELECT
  md5(p.id || wm."userId" || wm.id) AS id,
  p.id AS "projectId",
  wm."userId" AS "userId",
  wm.role AS "role",
  NOW() AS "createdAt"
FROM "Project" p
JOIN "WorkspaceMember" wm ON wm."workspaceId" = p."workspaceId"
ON CONFLICT ("projectId", "userId") DO NOTHING;
