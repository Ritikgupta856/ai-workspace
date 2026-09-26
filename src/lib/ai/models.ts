/**
 * The only place that decides which model runs. Plain "provider/model" strings
 * go through Vercel AI Gateway (AI_GATEWAY_API_KEY), so switching model is an
 * env change, not a code change: a cheap one while testing, a stronger one for
 * demos. The browser never picks a model.
 */
export const CHAT_MODEL = process.env.AI_MODEL || "openai/gpt-5-nano"

/** Classifies every turn before the answer starts, so it should stay small and fast. */
export const ROUTER_MODEL = process.env.AI_ROUTER_MODEL || "openai/gpt-5-nano"

/**
 * OpenAI's `reasoningEffort`, only for OpenAI models. The Gateway maps it onto
 * other providers' thinking settings, and some reject it (Gemini 2.5 errors
 * with "thinking_level is not supported"), so everyone else gets their default.
 */
type ReasoningEffort = "minimal" | "low" | "medium"

export function reasoningOptions(
  model: string,
  effort: ReasoningEffort
): Record<string, { reasoningEffort: ReasoningEffort }> {
  return model.startsWith("openai/") ? { openai: { reasoningEffort: effort } } : {}
}
