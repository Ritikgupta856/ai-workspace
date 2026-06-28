"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { TaskDetailsHeader } from "@/components/tasks/task-details-header"
import { TaskMetadataBar } from "@/components/tasks/task-metadata-bar"
import { TaskDescriptionCard } from "@/components/tasks/task-description-card"
import { TaskChecklistCard } from "@/components/tasks/task-checklist-card"
import { TaskCommentsSection } from "@/components/tasks/task-comments-section"
import { AIPanel } from "@/components/tasks/task-ai-panel"
import { TaskActivityTimeline } from "@/components/tasks/task-activity-timeline"
import { TaskAttachmentsGrid } from "@/components/tasks/task-attachments-grid"
import { TaskLinkedItems } from "@/components/tasks/task-linked-items"
import { TaskDetailsSidebar } from "@/components/tasks/task-details-sidebar"
import { useIsMobile } from "@/hooks/use-mobile"

const navTabs = [
  { value: "overview", label: "Overview" },
  { value: "ai", label: "AI" },
  { value: "activity", label: "Activity" },
  { value: "attachments", label: "Attachments" },
  { value: "linked", label: "Linked Items" },
]

export default function TaskDetailsPage() {
  const params = useParams()
  const isMobile = useIsMobile()
  const taskId = params.taskId as string
  const [activeTab, setActiveTab] = React.useState("overview")
  const [favorite, setFavorite] = React.useState(false)

  return (
    <div className="flex flex-1 flex-col gap-6">
      <TaskDetailsHeader
        title="Fix authentication bug in staging"
        favorite={favorite}
        onFavorite={() => setFavorite(!favorite)}
        onShare={() => console.log("Share")}
        onEdit={() => console.log("Edit")}
        onDuplicate={() => console.log("Duplicate")}
        onArchive={() => console.log("Archive")}
        onDelete={() => console.log("Delete")}
      />

      <TaskMetadataBar
        status="IN_PROGRESS"
        priority="HIGH"
        assignee="Ritik Gupta"
        project="Synapse"
        dueDate="2026-07-05"
      />

      <div className="flex flex-col gap-8 xl:flex-row">
        {/* Main Content */}
        <div className="min-w-0 flex-1 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="h-auto w-full justify-start gap-0 rounded-none border-b bg-transparent p-0">
              {navTabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={cn(
                    "relative rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium text-muted-foreground transition-colors",
                    "hover:text-foreground",
                    "data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none"
                  )}
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="overview" className="mt-6 space-y-6">
              <TaskDescriptionCard
                description="Users are experiencing authentication failures in the staging environment after the latest deployment. The issue manifests as intermittent 401 errors when accessing protected routes, even with valid JWT tokens. Initial investigation suggests the token refresh mechanism may be failing under certain conditions related to the new rate-limiting middleware."
                acceptanceCriteria="- Users can log in successfully with valid credentials\n- Token refresh works seamlessly without UI disruption\n- Session persists across page reloads\n- Rate limiting does not interfere with auth flow\n- All existing tests pass"
                createdBy="Ritik Gupta"
                createdAt="2026-06-20T08:00:00"
                updatedAt="2026-06-27T10:30:00"
              />

              <TaskChecklistCard
                items={[
                  { id: "1", text: "Reproduce issue locally", completed: true },
                  { id: "2", text: "Find root cause in auth middleware", completed: true },
                  { id: "3", text: "Implement fix", completed: false },
                  { id: "4", text: "Write tests", completed: false },
                  { id: "5", text: "Deploy to staging", completed: false },
                ]}
              />

              <TaskCommentsSection
                comments={[
                  {
                    id: "c1",
                    author: "Priya Sharma",
                    content: "I've been able to reproduce this consistently on staging-2. It seems related to the rate limiter intercepting auth headers.",
                    createdAt: "2026-06-25T14:30:00",
                    reactions: [
                      { emoji: "👍", count: 3 },
                      { emoji: "🔍", count: 1 },
                    ],
                  },
                  {
                    id: "c2",
                    author: "Arjun Patel",
                    content: "Found the issue. The `checkRateLimit` middleware runs before `verifyToken` in the middleware chain. On the second request, the rate limiter returns a 429 but incorrectly masks as a 401.",
                    createdAt: "2026-06-26T09:15:00",
                    reactions: [
                      { emoji: "🎯", count: 5 },
                      { emoji: "🔥", count: 2 },
                    ],
                  },
                ]}
              />
            </TabsContent>

            <TabsContent value="ai" className="mt-6">
              <AIPanel />
            </TabsContent>

            <TabsContent value="activity" className="mt-6">
              <TaskActivityTimeline
                activities={[
                  {
                    id: "a1",
                    type: "status_change",
                    actor: "Ritik Gupta",
                    description: "changed status from Todo to In Progress",
                    timestamp: "2026-06-27T10:30:00",
                  },
                  {
                    id: "a2",
                    type: "pr_linked",
                    actor: "Ritik Gupta",
                    description: "linked PR #214 - Fix auth rate-limiting conflict",
                    timestamp: "2026-06-27T10:25:00",
                  },
                  {
                    id: "a3",
                    type: "comment_added",
                    actor: "Arjun Patel",
                    description: "commented on this task",
                    timestamp: "2026-06-26T09:15:00",
                  },
                  {
                    id: "a4",
                    type: "comment_added",
                    actor: "Priya Sharma",
                    description: "commented on this task",
                    timestamp: "2026-06-25T14:30:00",
                  },
                  {
                    id: "a5",
                    type: "document_uploaded",
                    actor: "Ritik Gupta",
                    description: "uploaded auth-flow-diagram.pdf",
                    timestamp: "2026-06-24T16:00:00",
                  },
                  {
                    id: "a6",
                    type: "ai_generated",
                    actor: "Synapse AI",
                    description: "generated subtasks for this task",
                    timestamp: "2026-06-24T11:00:00",
                  },
                  {
                    id: "a7",
                    type: "due_date_updated",
                    actor: "Ritik Gupta",
                    description: "set due date to Jul 5",
                    timestamp: "2026-06-23T14:00:00",
                  },
                  {
                    id: "a8",
                    type: "task_completed",
                    actor: "Ritik Gupta",
                    description: "completed subtask: Reproduce issue locally",
                    timestamp: "2026-06-23T10:00:00",
                  },
                ]}
              />
            </TabsContent>

            <TabsContent value="attachments" className="mt-6">
              <TaskAttachmentsGrid
                attachments={[
                  {
                    id: "f1",
                    name: "auth-flow-diagram.pdf",
                    size: "2.4 MB",
                    uploadedBy: "Ritik Gupta",
                    uploadedAt: "2026-06-24T16:00:00",
                    type: "pdf",
                  },
                  {
                    id: "f2",
                    name: "error-logs-staging.txt",
                    size: "156 KB",
                    uploadedBy: "Priya Sharma",
                    uploadedAt: "2026-06-25T14:30:00",
                    type: "code",
                  },
                  {
                    id: "f3",
                    name: "rate-limiter-config.json",
                    size: "12 KB",
                    uploadedBy: "Arjun Patel",
                    uploadedAt: "2026-06-26T09:15:00",
                    type: "code",
                  },
                  {
                    id: "f4",
                    name: "auth-fix-screenshot.png",
                    size: "3.1 MB",
                    uploadedBy: "Ritik Gupta",
                    uploadedAt: "2026-06-27T10:30:00",
                    type: "image",
                  },
                  {
                    id: "f5",
                    name: "deployment-notes.md",
                    size: "4 KB",
                    uploadedBy: "Ritik Gupta",
                    uploadedAt: "2026-06-27T10:30:00",
                    type: "markdown",
                  },
                  {
                    id: "f6",
                    name: "auth-module-backup.zip",
                    size: "8.7 MB",
                    uploadedBy: "Priya Sharma",
                    uploadedAt: "2026-06-25T14:30:00",
                    type: "zip",
                  },
                ]}
              />
            </TabsContent>

            <TabsContent value="linked" className="mt-6">
              <TaskLinkedItems
                items={[
                  { id: "pr1", title: "PR #214: Fix auth rate-limiting conflict", type: "pr", metadata: "Open • main • Jun 27, 2026" },
                  { id: "is1", title: "Issue #18: Auth failures in staging", type: "issue", metadata: "Bug • High • Jun 22, 2026" },
                  { id: "co1", title: "a1b2c3d — fix: resolve auth middleware ordering", type: "commit", metadata: "main • 2 hours ago" },
                  { id: "doc1", title: "Auth Architecture.md", type: "document", metadata: "Updated Jun 24" },
                  { id: "doc2", title: "Auth Flow.pdf", type: "document", metadata: "Updated Jun 24" },
                  { id: "kn1", title: "JWT Authentication Best Practices", type: "knowledge", metadata: "Knowledge base" },
                  { id: "t1", title: "Add rate limiting to API routes", type: "task", metadata: "AUTH-24 • In Progress" },
                  { id: "t2", title: "Update auth middleware tests", type: "task", metadata: "AUTH-19 • Todo" },
                ]}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Sidebar */}
        {!isMobile && (
          <div className="w-full shrink-0 xl:w-80">
            <div className="sticky top-6">
              <TaskDetailsSidebar
                status="IN_PROGRESS"
                priority="HIGH"
                assignee="Ritik Gupta"
                project="Synapse"
                dueDate="2026-07-05"
                labels={["bug", "auth", "staging"]}
                estimatedTime={4}
                createdBy="Ritik Gupta"
                createdAt="2026-06-20T08:00:00"
                updatedAt="2026-06-27T10:30:00"
              />
            </div>
          </div>
        )}
      </div>

      {/* Mobile sidebar at bottom */}
      {isMobile && (
        <div className="mt-4">
          <TaskDetailsSidebar
            status="IN_PROGRESS"
            priority="HIGH"
            assignee="Ritik Gupta"
            project="Synapse"
            dueDate="2026-07-05"
            labels={["bug", "auth", "staging"]}
            estimatedTime={4}
            createdBy="Ritik Gupta"
            createdAt="2026-06-20T08:00:00"
            updatedAt="2026-06-27T10:30:00"
          />
        </div>
      )}
    </div>
  )
}
