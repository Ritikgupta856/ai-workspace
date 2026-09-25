import { APICallError, RetryError } from "ai"

/**
 * Turns a provider failure into a message fit to show in the chat. Gemini's own
 * wording ("This model is currently experiencing high demand") and raw status
 * codes are not meant for users.
 */
export function describeModelError(err: unknown): string {
  // The SDK retries transient failures and wraps them; the last attempt says what actually went wrong.
  const cause = RetryError.isInstance(err) ? err.lastError : err
  const statusCode = APICallError.isInstance(cause) ? cause.statusCode : undefined

  if (statusCode === 429) {
    return "You've reached the AI usage limit for now. Please wait a minute and try again."
  }
  if (statusCode !== undefined && statusCode >= 500) {
    return "The AI model is experiencing high demand right now. Please try again in a moment."
  }
  if (cause instanceof Error && (cause.name === "TimeoutError" || cause.name === "AbortError")) {
    return "The AI model took too long to respond. Please try again."
  }
  return "Something went wrong while generating a response. Please try again."
}
