/**
 * Every query key in one place. Keys nest from broad to specific, so
 * invalidating `tasks.all` refreshes every task query, while
 * `tasks.panel(id)` touches just one task's panel.
 */
export const queryKeys = {
  tasks: {
    all: ["tasks"] as const,
    list: (scope: { assignedToMe?: boolean; projectId?: string }) =>
      ["tasks", "list", scope.assignedToMe ? "mine" : (scope.projectId ?? "all")] as const,
    panel: (id: string) => ["tasks", "panel", id] as const,
    comments: (id: string) => ["tasks", "comments", id] as const,
    activity: (id: string) => ["tasks", "activity", id] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    view: (view: string) => ["notifications", view] as const,
  },
  workspace: {
    all: ["workspace"] as const,
    members: ["workspace", "members"] as const,
    invites: ["workspace", "invites"] as const,
  },
  projects: {
    dashboard: (projectId: string) => ["projects", "dashboard", projectId] as const,
  },
  search: (query: string) => ["search", query] as const,
  library: (section: string, projectId: string) => ["library", section, projectId] as const,
  projectList: ["projects", "list"] as const,
  pages: {
    detail: (pageId: string) => ["pages", "detail", pageId] as const,
    list: (projectId: string) => ["pages", "list", projectId] as const,
  },
  invite: (token: string) => ["invite", token] as const,
  settings: ["settings"] as const,
  integrations: ["integrations"] as const,
  sidebar: {
    all: ["sidebar"] as const,
    of: (workspaceId: string | null) => ["sidebar", workspaceId ?? "none"] as const,
  },
  favorites: {
    one: (entityType: string, entityId: string) => ["favorites", entityType, entityId] as const,
  },
  members: {
    /** Assignable people: a project's members, or the whole workspace when `projectId` is null. */
    assignable: (projectId: string | null) => ["members", "assignable", projectId ?? "workspace"] as const,
  },
}
