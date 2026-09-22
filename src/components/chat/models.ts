/**
 * Models the agent can run on.
 *
 * Google retires model ids fairly aggressively: `gemini-2.5-pro` and
 * `gemini-2.5-flash-lite` both answer 404 ("no longer available to new users")
 * on keys created after their cutoff, which is indistinguishable from an outage
 * unless you read the response body. Verify an id actually returns a completion
 * before adding it here — being listed by the models endpoint is not enough,
 * since retired ids are still listed.
 */
export const AGENT_MODELS = [
  { id: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash-Lite", hint: "Fast, everyday" },
  { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash", hint: "Balanced" },
  { id: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro", hint: "Deeper reasoning" },
] as const

export type AgentModelId = (typeof AGENT_MODELS)[number]["id"]

export const DEFAULT_AGENT_MODEL: AgentModelId = "gemini-3.5-flash-lite"
