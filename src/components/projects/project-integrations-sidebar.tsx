"use client"

import * as React from "react"
import { ChevronRight, Code2, MessageSquare, FileText, GitBranch } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface IntegrationItemData {
  id: string
  name: string
  type: string
  status: string
  connected: boolean
}

const typeIcon: Record<string, React.ReactNode> = {
  GITHUB: <Code2 className="size-4" />,
  SLACK: <MessageSquare className="size-4" />,
  NOTION: <FileText className="size-4" />,
  LINEAR: <GitBranch className="size-4" />,
}

export function ProjectIntegrationsSidebar({ integrations }: { integrations: IntegrationItemData[] }) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-foreground">Integrations</h3>
      {integrations.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-sm text-muted-foreground">No integrations connected.</p>
          <Button variant="outline" size="sm" className="mt-3">
            Connect Integration
          </Button>
        </div>
      ) : (
        <div className="space-y-1">
          {integrations.map((integration) => (
            <div
              key={integration.id}
              className="flex items-center justify-between rounded-lg px-2 py-2.5 transition-colors hover:bg-accent/50"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
                  {typeIcon[integration.type] || <Code2 className="size-4" />}
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
                  <Badge
                    variant="secondary"
                    className={cn(
                      "px-2 py-0.5 text-[10px] font-medium",
                      integration.status === "ERROR"
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {integration.status === "ERROR" ? "Error" : "Disconnected"}
                  </Badge>
                )}
                <ChevronRight className="size-4 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
