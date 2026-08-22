export interface IntegrationConfig {
  id: string
  mcpUrl: string
  transportType: "sse" | "streamable-http"
}

export const INTEGRATIONS: IntegrationConfig[] = [
  { id: "github", mcpUrl: "https://api.githubcopilot.com/mcp/", transportType: "streamable-http" },
  { id: "notion", mcpUrl: "https://mcp.notion.com/mcp", transportType: "streamable-http" },
  { id: "linear", mcpUrl: "https://mcp.linear.app/mcp", transportType: "streamable-http" },
  { id: "figma", mcpUrl: "https://mcp.figma.com/mcp", transportType: "streamable-http" },
]
