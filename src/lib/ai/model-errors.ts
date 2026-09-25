import { APICallError, RetryError } from "ai"

export type ModelErrorCode = "model_busy" | "rate_limited" | "timeout" | "no_output" | "unknown"

/** JSON body /api/chat answers with when a turn fails before the model writes anything. */
export type ModelErrorBody = { code: ModelErrorCode; error: string }

/** Appended to an answer whose stream breaks after text has already been sent. */
export const INTERRUPTED_NOTE = "_The response was interrupted. Please try again._"

export const NO_OUTPUT_ERROR: ModelErrorBody = {
  code: "no_output",
  error: "The model didn't return an answer. Please try again.",
}

/**
 * Maps a provider failure to a status and a message fit to show in the chat.
 * Gemini's own wording ("This model is currently experiencing high demand")
 * and raw status codes are not meant for users.
 */
export function describeModelError(err: unknown): { status: number; body: ModelErrorBody } {
  // The SDK retries transient failures and wraps them; the last attempt says what actually went wrong.
  const cause = RetryError.isInstance(err) ? err.lastError : err
  const statusCode = APICallError.isInstance(cause) ? cause.statusCode : undefined

  if (statusCode === 429) {
    return {
      status: 429,
      body: {
        code: "rate_limited",
        error: "You've reached the AI usage limit for now. Please wait a minute and try again.",
      },
    }
  }

  if (statusCode !== undefined && statusCode >= 500) {
    return {
      status: 503,
      body: {
        code: "model_busy",
        error: "The AI model is experiencing high demand right now. Please try again in a moment.",
      },
    }
  }

  if (cause instanceof Error && (cause.name === "TimeoutError" || cause.name === "AbortError")) {
    return {
      status: 504,
      body: { code: "timeout", error: "The AI model took too long to respond. Please try again." },
    }
  }

  return {
    status: 500,
    body: { code: "unknown", error: "Something went wrong while generating a response. Please try again." },
  }
}
