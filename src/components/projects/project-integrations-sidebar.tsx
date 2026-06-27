"use client"

import * as React from "react"
import { ChevronRight, Code2, MessageSquare, FileText, GitBranch } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface IntegrationData {
  id: string
  name: string
  icon: React.ReactNode
  connected: boolean
}

const integrations: IntegrationData[] = [
  {
    id: "i1",
    name: "GitHub",
    icon: <Code2 className="size-4" />,
    connected: true,
  },
  {
    id: "i2",
    name: "Slack",
    icon: <MessageSquare className="size-4" />,
    connected: true,
  },
  {
    id: "i3",
    name: "Notion",
    icon: <FileText className="size-4" />,
    connected: true,
  },
  {
    id: "i4",
    name: "Linear",
    icon: <GitBranch className="size-4" />,
    connected: false,
  },
]

export function ProjectIntegrationsSidebar() {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-foreground">Integrations</h3>
      <div className="space-y-1">
        {integrations.map((integration) => (
          <div
            key={integration.id}
            className="flex items-center justify-between rounded-lg px-2 py-2.5 transition-colors hover:bg-accent/50"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
                {integration.icon}
              </div>
              <span className="text-sm font-medium text-foreground">{integration.name}</span>
            </div>
            <div className="flex items-center gap-2">
              {integration.connected ? (
                <Badge
                  variant="secondary"
                  className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-medium"
                >
                  Connected
                </Badge>
              ) : (
                <span className="text-xs text-muted-foreground">Disconnected</span>
              )}
              <ChevronRight className="size-4 text-muted-foreground" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
