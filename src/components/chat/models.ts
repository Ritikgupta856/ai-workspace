/**
 * Models the agent can run on.
 *
 * Google retires model ids fairly aggressively: `gemini-2.5-pro` and
 * `gemini-2.5-flash-lite` both answer 404 ("no longer available to new users")
 * on keys created after their cutoff, which is indistinguishable from an outage
 * unless you read the response body. Verify an id actually returns a completion
 * before adding it here — being listed by the models endpoint is not enough,
 * since retired ids are still listed.
 *
 * Pro models are left out on purpose: free-tier keys get a quota of 0 for them
 * (`gemini-3.1-pro-preview` answers 429 on the very first request).
 */
export const AGENT_MODELS = [
  { id: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash-Lite", hint: "Fast, everyday" },
  { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash", hint: "Balanced" },
] as const

export type AgentModelId = (typeof AGENT_MODELS)[number]["id"]

export const DEFAULT_AGENT_MODEL: AgentModelId = "gemini-3.5-flash-lite"
