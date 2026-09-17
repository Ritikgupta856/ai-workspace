/** Models the agent can run on. Only Google is keyed in this workspace today. */
export const AGENT_MODELS = [
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", hint: "Fast, everyday" },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro", hint: "Deeper reasoning" },
  { id: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash-Lite", hint: "Lightest, cheapest" },
] as const

export type AgentModelId = (typeof AGENT_MODELS)[number]["id"]

export const DEFAULT_AGENT_MODEL: AgentModelId = "gemini-2.5-flash"
